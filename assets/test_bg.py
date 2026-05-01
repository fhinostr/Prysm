from PIL import Image
import numpy as np

img = Image.open('prysm-logo-new.png').convert('RGBA')
arr = np.array(img)

is_light = (arr[:,:,0] > 190) & (arr[:,:,1] > 190) & (arr[:,:,2] > 190)
print(f"Total pixels: {arr.shape[0] * arr.shape[1]}")
print(f"Light pixels: {is_light.sum()}")

# To soften the edges, we can apply an alpha gradient based on brightness
# But let's first just set light pixels to transparent and see.
arr[is_light, 3] = 0

out = Image.fromarray(arr)
out.save('prysm-logo-new-transparent.png')
