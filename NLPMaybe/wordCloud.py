#!/usr/bin/env python

import sys
from os import path
import numpy as np
from PIL import Image
from wordcloud import WordCloud
import matplotlib.pyplot as plt

d = path.dirname(__file__)
fname = sys.argv[1]
text = open(path.join(d, fname)).read()

wordcloud = WordCloud().generate(text)

f = plt.figure()
plt.imshow(wordcloud, interpolation='bilinear')
plt.axis("off")
f = plt.savefig("wc.pdf", bbox_inches='tight')
