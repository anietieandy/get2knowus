#!/usr/bin/env python

import sys
from os import path
import numpy as np
from PIL import Image
from datetime import datetime
from wordcloud import WordCloud
import matplotlib.pyplot as plt
import time

d = path.dirname(__file__)
fname = sys.argv[1] #if len(sys.argv)>1 else 'output1.txt'

text = open(fname).read()#open(path.join(d, fname)).read()

wordcloud = WordCloud().generate(text)

with open("NLPMaybe/log.txt", "a") as myfile:
    myfile.write("\n" + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + " WordCloud ran!")

f = plt.figure()
plt.imshow(wordcloud, interpolation='bilinear')
plt.axis("off")
f = plt.savefig("public/images/wc1.png", bbox_inches='tight')
