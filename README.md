# PixelBurst

PixelBurst is a image generation tool that processes text-based (`.bt` files) templates into PNG images. The templates define pixel colors and transparency using a simple syntax, allowing you to create pixel art or patterns programmatically.

## Template Syntax
- `[color]`: Specifies a color for a single pixel. E.g., [red] creates a red pixel.
- `[color/opacity]`: Specifies a color with a specific opacity (0-100%). E.g., [red/50] creates a red pixel with 50% opacity.
- `[color:columns]`: Expands the specified color across a number of columns. E.g., [red:3] creates three adjacent red pixels.
- `[color/opacity:columns]`: Expands the specified color and opacity across multiple columns. E.g., [red/50:3] creates three adjacent red pixels with 50% opacity.
- `[](rows)`: Repeats the entire preceding row a specified number of times. E.g., (...) repeats the row downwards.

## Examples

Below are some examples of how to define your templates:

### Basic Grid
A basic 3x2 grid with different colors:
```
[red][green][blue]
[white][black][transparent]
```
### Repeating Rows
Repeat the entire row 3 times vertically:
```
[red][green][blue](3)
```
### Horizontal Color Expansion
Expand each color horizontally across 3 columns:
```
[red:3]
[green:3]
[blue:3]
```
### Opacity
Specify colors with varying levels of opacity:
```
[red/20]
[green/40]
[blue/60]
```
### Horizontal Expansion with Opacity
Expand colors horizontally across 3 columns, applying opacity to each expanded column:
```
[red/20:3]
[green/40:3]
[blue/60:3]
```

## Usage
Place your templates in the src directory with a `.bt` extension. Run the script, and the output will be generated in the dist directory as PNG files. Ensure your color definitions are included in the `palette.json` file.
