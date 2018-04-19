#!/usr/bin/env python
"""
Masked wordcloud
================
Using a mask you can generate wordclouds in arbitrary shapes.
"""
import sys
import matplotlib
matplotlib.use('Agg')
from os import path
from PIL import Image
import numpy as np
import matplotlib.pyplot as plt
from wordcloud import WordCloud, STOPWORDS

d = path.dirname(__file__)
fname = sys.argv[1] #if len(sys.argv)>1 else 'output1.txt'
text = open(fname).read()#open(path.join(d, fname)).read()
#link to the picture that the word cloud should fill
my_mask = np.array(Image.open(path.join(d, "outline.png")))
stopwords = set(STOPWORDS)
stopwords.add("said")
wc = WordCloud(background_color="white", max_words=2000, mask=my_mask,
               stopwords=stopwords)
wc.generate(text)
wc.to_file("public/images/wc2.png")

######### Code to see word cloud ########
# show
# plt.imshow(wc, interpolation='bilinear')
# plt.axis("off")
# plt.imshow(alice_mask, cmap=plt.cm.gray, interpolation='bilinear')
# plt.axis("off")
# plt.show()