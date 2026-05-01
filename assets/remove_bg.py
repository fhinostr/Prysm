import numpy as np
from PIL import Image

img = Image.open('prysm-logo-new.png').convert('RGBA')
arr = np.array(img).astype(float)

# Calculate the minimum RGB channel value for each pixel
min_rgb = arr[:, :, 0:3].min(axis=2)

# Create a smooth alpha ramp:
# If min_rgb > 220, it's very light gray/white -> alpha = 0
# If min_rgb < 170, it's part of the dark letters or vivid colors -> alpha = 255
new_alpha = np.clip((220 - min_rgb) / (220 - 170) * 255, 0, 255)

# Update the alpha channel
arr[:, :, 3] = np.minimum(arr[:, :, 3], new_alpha)

# Save the transparent image, overwriting the original
out = Image.fromarray(arr.astype(np.uint8))
out.save('prysm-logo-new.png')
print("Background removed successfully.")
