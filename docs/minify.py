#!/usr/bin/env python3
import re

def minify_css(css_content):
    # Remove comments
    css_content = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)
    # Remove whitespace
    css_content = re.sub(r'\s+', ' ', css_content)
    # Remove spaces around special characters
    css_content = re.sub(r'\s*([{}:;,>+~])\s*', r'\1', css_content)
    # Remove last semicolon in block
    css_content = re.sub(r';}', '}', css_content)
    return css_content.strip()

def minify_js(js_content):
    # Remove single-line comments
    js_content = re.sub(r'//.*?$', '', js_content, flags=re.MULTILINE)
    # Remove multi-line comments
    js_content = re.sub(r'/\*.*?\*/', '', js_content, flags=re.DOTALL)
    # Remove excessive whitespace
    js_content = re.sub(r'\s+', ' ', js_content)
    # Remove whitespace around operators
    js_content = re.sub(r'\s*([{}();,=<>!+\-*/&|])\s*', r'\1', js_content)
    return js_content.strip()

# Minify CSS
with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()
minified_css = minify_css(css)
with open('styles.min.css', 'w', encoding='utf-8') as f:
    f.write(minified_css)

# Minify JS
with open('script.js', 'r', encoding='utf-8') as f:
    js = f.read()
minified_js = minify_js(js)
with open('script.min.js', 'w', encoding='utf-8') as f:
    f.write(minified_js)

css_original = len(css) / 1024
css_minified = len(minified_css) / 1024
js_original = len(js) / 1024
js_minified = len(minified_js) / 1024

print(f"CSS: {css_original:.1f}KB → {css_minified:.1f}KB (saved {css_original - css_minified:.1f}KB)")
print(f"JS:  {js_original:.1f}KB → {js_minified:.1f}KB (saved {js_original - js_minified:.1f}KB)")
