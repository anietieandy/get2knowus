#!/usr/bin/env python
"""
Masked wordcloud
================
Using a mask you can generate wordclouds in arbitrary shapes.
"""
import sys
from os import path
from PIL import Image
import numpy as np
import matplotlib.pyplot as plt

from wordcloud import WordCloud, STOPWORDS

d = path.dirname(__file__)
# fname = sys.argv[1] if len(sys.argv)>1 else 'output1.txt'
fname = sys.argv[1] #if len(sys.argv)>1 else 'output1.txt'
# text = open(path.join(d, fname)).read()

text = open(fname).read()#open(path.join(d, fname)).read()

# read the mask image
my_mask = np.array(Image.open(path.join(d, "outline.png")))

stopwords = set(STOPWORDS)
stopwords.add("said")

wc = WordCloud(background_color="white", max_words=2000, mask=my_mask,
               stopwords=stopwords)
# generate word cloud
wc.generate(text)

# store to file
wc.to_file("public/images/wc2.png")

# show
# plt.imshow(wc, interpolation='bilinear')
# plt.axis("off")
# plt.imshow(alice_mask, cmap=plt.cm.gray, interpolation='bilinear')
# plt.axis("off")
# plt.show()