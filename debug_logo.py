#!/usr/bin/env python3

import asyncio
from playwright.async_api import async_playwright

async def debug_logo():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()

        # Go to local site
        await page.goto("http://localhost:8080")
        await page.wait_for_timeout(2000)

        # Take screenshot
        await page.screenshot(path="full_page.png")
        print("📸 Full page screenshot saved as full_page.png")

        # Focus on logo area
        logo = page.locator('.logo img').first
        await logo.screenshot(path="logo_only.png")
        print("📸 Logo screenshot saved as logo_only.png")

        # Get computed styles
        logo_styles = await page.evaluate('''
            () => {
                const logo = document.querySelector('.logo img');
                const computed = window.getComputedStyle(logo);
                return {
                    background: computed.background,
                    backgroundColor: computed.backgroundColor,
                    backgroundImage: computed.backgroundImage,
                    border: computed.border,
                    boxShadow: computed.boxShadow,
                    display: computed.display
                };
            }
        ''')

        print("\n🔍 Logo computed styles:")
        for prop, value in logo_styles.items():
            print(f"   {prop}: {value}")

        # Check nav styles
        nav_styles = await page.evaluate('''
            () => {
                const nav = document.querySelector('nav');
                const computed = window.getComputedStyle(nav);
                return {
                    background: computed.background,
                    backgroundColor: computed.backgroundColor,
                    backgroundImage: computed.backgroundImage
                };
            }
        ''')

        print("\n🔍 Nav computed styles:")
        for prop, value in nav_styles.items():
            print(f"   {prop}: {value}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_logo())