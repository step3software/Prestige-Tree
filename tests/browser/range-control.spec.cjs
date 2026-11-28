const {test,expect}=require('@playwright/test');

test('shared range fills checkboxes, preserves bounds and switches at six with caller color',async({page})=>{
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
    await page.goto('/');await expect(page.getByTestId('population')).toBeVisible();
    await page.evaluate(()=>{
        gameUI.session.runtimeServices.gameRuntime.stop();
        const host=document.createElement('div');document.querySelector('main').append(host);
        window.rangeExample=Vue.reactive({value:0,min:0,max:5,color:'#0088cc',disabled:false,accept:true});
        Vue.createApp({
            components:{'range-control':createRangeControl()},
            data:()=>({example:window.rangeExample}),
            template:`<range-control id="example-range" label="Example selection with a long visible label" :value="example.value" :min="example.min" :max="example.max" :color="example.color" :disabled="example.disabled" @change="example.accept && (example.value = $event)"></range-control>`,
        }).mount(host);
    });
    const control=page.locator('#example-range'),checked=control.getByRole('checkbox',{checked:true});
    const box=level=>control.locator(`input[value="${level}"]`);
    await expect(control.getByRole('checkbox')).toHaveCount(5);
    await expect(control.getByRole('slider')).toHaveCount(0);
    await expect(box(1)).toHaveCSS('accent-color','rgb(0, 136, 204)');
    await box(4).click();await expect(checked).toHaveCount(4);await expect(box(5)).not.toBeChecked();
    await box(2).focus();await page.keyboard.press('Space');await expect(checked).toHaveCount(2);
    await expect(box(2)).toBeFocused();
    expect(await box(2).evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
    await box(2).click();await expect(checked).toHaveCount(1);
    await box(1).click();await expect(checked).toHaveCount(0);
    await page.evaluate(()=>window.rangeExample.min=1);
    await box(1).click();await box(1).click();await expect(checked).toHaveCount(1);
    await page.evaluate(()=>{window.rangeExample.min=3;window.rangeExample.value=3;});
    await expect(box(2)).toBeDisabled();await box(3).click();await expect(checked).toHaveCount(3);
    await page.evaluate(()=>window.rangeExample.accept=false);
    await box(5).click();await expect(checked).toHaveCount(3);await expect(box(5)).not.toBeChecked();
    await page.evaluate(()=>window.rangeExample.disabled=true);
    for(const input of await control.locator('input').all()) await expect(input).toBeDisabled();
    await page.evaluate(()=>{window.rangeExample.max=6;window.rangeExample.disabled=false;window.rangeExample.accept=true;});
    const slider=control.getByRole('slider',{name:'Example selection with a long visible label'});
    await expect(control.getByRole('checkbox')).toHaveCount(0);
    await expect(slider).toHaveAttribute('max','6');await expect(slider).toHaveAttribute('min','3');
    await expect(slider).toHaveValue('3');await slider.focus();await page.keyboard.press('End');await expect(slider).toHaveValue('6');
    await page.evaluate(()=>window.rangeExample.accept=false);
    await page.keyboard.press('Home');await expect(slider).toHaveValue('6');
    await page.evaluate(()=>{window.rangeExample.disabled=true;window.rangeExample.color='#e34b42';});
    await expect(slider).toBeDisabled();
    await expect(slider).toHaveCSS('accent-color','rgb(227, 75, 66)');
    await page.evaluate(()=>{window.rangeExample.value=3;window.rangeExample.max=5;window.rangeExample.disabled=false;});
    await expect(checked).toHaveCount(3);
    await expect(box(3)).toHaveCSS('accent-color','rgb(227, 75, 66)');
    for(const width of [1280,768,320]){
        await page.setViewportSize({width,height:900});await expect(control).toBeVisible();
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
    expect(errors).toEqual([]);
});
