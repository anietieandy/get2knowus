#!/usr/bin/env python
"""
Masked wordcloud
================
Using a mask you can generate wordclouds in arbitrary shapes.
"""

from os import path
from PIL import Image
import numpy as np
import matplotlib.pyplot as plt

from wordcloud import WordCloud, STOPWORDS

d = path.dirname(__file__)

# Read the whole text.
text = open(path.join(d, 'output1.txt')).read()

# read the mask image
alice_mask = np.array(Image.open(path.join(d, "helmet.png")))

stopwords = set(STOPWORDS)
stopwords.add("said")

wc = WordCloud(background_color="white", max_words=2000, mask=alice_mask,
               stopwords=stopwords)
# generate word cloud
wc.generate(text)

# store to file
wc.to_file(path.join(d, "wc.png"))

# show
plt.imshow(wc, interpolation='bilinear')
plt.axis("off")
f = plt.figure()
plt.imshow(alice_mask, cmap=plt.cm.gray, interpolation='bilinear')
plt.axis("off")
# plt.show()