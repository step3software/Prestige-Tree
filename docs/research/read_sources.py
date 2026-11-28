"""Locate the owner's EPUB and PDF passages without copying books into Git.

Python 3.12+. EPUB commands use the standard library; PDF commands need pypdf.
All commands are read-only and offline. EPUB ordinals match parser_version 1;
PDF page arguments always use one-based physical file pages.
"""
import argparse
import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree


MANIFEST_PATH = Path(__file__).with_name('sources.json')
BLOCK_TAGS = {'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'dt', 'dd', 'figcaption'}


def load_manifest():
    return json.loads(MANIFEST_PATH.read_text(encoding='utf-8'))


def open_source(book, library_root):
    path = Path(library_root) / book['relative_path']
    if not path.is_file():
        raise ValueError(f"Missing local source: {path}. Supply --library-root before the command.")
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest != book['sha256']:
        raise ValueError(f"Source hash mismatch: {path}. Reconcile the edition and its locators before use.")
    return path


def chapter_for(book, chapter_id):
    for chapter in book['chapters']:
        if chapter['id'] == chapter_id:
            return chapter
    raise ValueError(f"Unknown chapter {chapter_id!r}; use the chapters command.")


def read_paragraphs(path, chapter):
    with zipfile.ZipFile(path) as archive:
        content = archive.read(chapter['epub_href'])
    if hashlib.sha256(content).hexdigest() != chapter['sha256']:
        raise ValueError(f"Chapter hash mismatch: {chapter['epub_href']}")
    tree = ElementTree.fromstring(content)
    body = next((element for element in tree.iter() if local_tag(element) == 'body'), tree)
    paragraphs = []
    for element in body.iter():
        if local_tag(element) not in BLOCK_TAGS:
            continue
        text = re.sub(r'\s+', ' ', ''.join(element.itertext())).strip()
        if text:
            paragraphs.append(text)
    if len(paragraphs) != chapter['paragraph_count']:
        raise ValueError('Paragraph count differs from the index; reconcile the parser and source.')
    return paragraphs


def local_tag(element):
    return element.tag.rsplit('}', 1)[-1]


def pdf_reader(path):
    try:
        from pypdf import PdfReader
    except ImportError as error:
        raise ValueError('PDF lookup needs pypdf; install docs/research/requirements.txt '
                         'in your Python environment or use the bundled PDF runtime.') from error
    reader = PdfReader(path)
    if reader.is_encrypted:
        raise ValueError('Encrypted PDF is unsupported; no decryption or replacement is attempted.')
    return reader


def verify_pdf(reader, book):
    if len(reader.pages) != book['page_count'] or reader.page_labels != book['page_labels']:
        raise ValueError('PDF page count or printed labels differ from the index.')
    for chapter in book['chapters']:
        if not 1 <= chapter['start_page'] <= chapter['end_page'] <= len(reader.pages):
            raise ValueError('Invalid indexed PDF chapter range.')
        for heading in chapter['headings']:
            number = heading['file_page']
            if not chapter['start_page'] <= number <= chapter['end_page']:
                raise ValueError('PDF heading is outside its chapter.')
            if reader.page_labels[number - 1] != heading['printed_page']:
                raise ValueError('PDF heading printed label differs from the index.')


def print_pdf_page(reader, book, chapter, number):
    text = reader.pages[number - 1].extract_text() or '[No extractable text on this page.]'
    print(f"[{book['citation_prefix']} chapter {chapter['id']}, PDF file page {number}; "
          f"printed {book['page_labels'][number - 1]}]\n{text}\n")


def location_range(value):
    match = re.fullmatch(r'([1-9][0-9]*):([1-9][0-9]*)', value)
    if not match:
        raise argparse.ArgumentTypeError('Use a positive inclusive range such as 59:61.')
    first, last = map(int, match.groups())
    if first > last:
        raise argparse.ArgumentTypeError('The first location must not exceed the last.')
    return first, last


def build_parser(manifest):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--library-root', default=manifest['library']['local_root'])
    commands = parser.add_subparsers(dest='command', required=True)
    commands.add_parser('verify', help='Check every source hash and indexed chapter locator.')
    chapters = commands.add_parser('chapters', help='List chapter IDs and headings.')
    chapters.add_argument('book', choices=manifest['books'])
    read = commands.add_parser('read', help='Print a cited range from a local source.')
    read.add_argument('book', choices=manifest['books'])
    read.add_argument('chapter', help='Chapter/part ID from the chapters command.')
    locations = read.add_mutually_exclusive_group(required=True)
    locations.add_argument('--paragraphs', type=location_range, help='EPUB block range.')
    locations.add_argument('--pages', type=location_range, help='Physical PDF file-page range.')
    search = commands.add_parser('search', help='Find a literal phrase, case-insensitively.')
    search.add_argument('book', choices=manifest['books'])
    search.add_argument('query')
    search.add_argument('--limit', type=int, default=10)
    return parser


def print_passage(book, chapter, ordinal, text):
    print(f"[{book['citation_prefix']} chapter {chapter['id']}, paragraph {ordinal}] "
          f"{chapter['epub_href']}\n{text}\n")


def run(args, manifest):
    books = manifest['books']
    if args.command == 'verify':
        for key, book in books.items():
            path = open_source(book, args.library_root)
            if book['format'] == 'pdf':
                verify_pdf(pdf_reader(path), book)
                print(f"Verified {key}: PDF hash, {book['page_count']} pages, printed labels and chapter ranges.")
                continue
            for chapter in book['chapters']:
                paragraphs = read_paragraphs(path, chapter)
                for heading in chapter['headings']:
                    if paragraphs[heading['paragraph'] - 1] != heading['title']:
                        raise ValueError(f"Heading mismatch in {key} chapter {chapter['id']}")
            print(f"Verified {key}: EPUB hash, {len(book['chapters'])} chapters and all heading locations.")
        return

    book = books[args.book]
    path = open_source(book, args.library_root)
    if args.command == 'chapters':
        for chapter in book['chapters']:
            if book['format'] == 'pdf':
                print(f"{chapter['id']}: {chapter['title']} (PDF file pages "
                      f"{chapter['start_page']}:{chapter['end_page']}; printed "
                      f"{chapter['printed_start']}:{chapter['printed_end']})")
                for heading in chapter['headings']:
                    print(f"  PDF {heading['file_page']} / printed {heading['printed_page']}: {heading['title']}")
                continue
            print(f"{chapter['id']}: {chapter['title']} ({chapter['paragraph_count']} paragraphs)")
            for heading in chapter['headings']:
                print(f"  {heading['paragraph']}: {heading['title']}")
        return

    if args.command == 'read':
        chapter = chapter_for(book, args.chapter)
        if book['format'] == 'pdf':
            if not args.pages:
                raise ValueError('PDF sources require --pages with physical file-page numbers.')
            first, last = args.pages
            if not chapter['start_page'] <= first <= last <= chapter['end_page']:
                raise ValueError(f"Chapter file-page range is {chapter['start_page']}:{chapter['end_page']}.")
            reader = pdf_reader(path)
            for number in range(first, last + 1):
                print_pdf_page(reader, book, chapter, number)
            return
        if not args.paragraphs:
            raise ValueError('EPUB sources require --paragraphs, not PDF page numbers.')
        paragraphs = read_paragraphs(path, chapter)
        first, last = args.paragraphs
        if last > len(paragraphs):
            raise ValueError(f"Chapter has {len(paragraphs)} paragraphs; requested {first}:{last}.")
        for ordinal in range(first, last + 1):
            print_passage(book, chapter, ordinal, paragraphs[ordinal - 1])
        return

    if args.limit < 1 or not args.query.strip():
        raise ValueError('Search needs a nonempty phrase and a positive result limit.')
    matches = 0
    if book['format'] == 'pdf':
        reader = pdf_reader(path)
        for chapter in book['chapters']:
            for number in range(chapter['start_page'], chapter['end_page'] + 1):
                text = reader.pages[number - 1].extract_text() or ''
                if args.query.casefold() in text.casefold():
                    print_pdf_page(reader, book, chapter, number)
                    matches += 1
                    if matches >= args.limit:
                        print(f'Stopped at the requested limit of {args.limit} matching pages.')
                        return
        print(f'{matches} matching pages in the indexed chapters.')
        return
    for chapter in book['chapters']:
        for ordinal, text in enumerate(read_paragraphs(path, chapter), start=1):
            if args.query.casefold() in text.casefold():
                print_passage(book, chapter, ordinal, text)
                matches += 1
                if matches >= args.limit:
                    print(f'Stopped at the requested limit of {args.limit} matching paragraphs.')
                    return
    print(f'{matches} matching paragraphs in the indexed chapters.')


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    try:
        manifest = load_manifest()
        args = build_parser(manifest).parse_args()
        run(args, manifest)
    except (OSError, ValueError, KeyError, zipfile.BadZipFile, ElementTree.ParseError) as error:
        print(f'Reference lookup failed: {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
