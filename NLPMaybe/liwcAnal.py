#!/usr/bin/env python

import sys
from os import path
import numpy as np
from PIL import Image
from datetime import datetime
from wordcloud import WordCloud
import matplotlib.pyplot as plt
import time
import pandas as pd
import re
import numpy as np
from collections import defaultdict # again, collections!
from itertools import chain 


d = path.dirname(__file__)
fname = sys.argv[1] #if len(sys.argv)>1 else 'output1.txt'
fname2 = sys.argv[2]

subset = open(fname).read()#open(path.join(d, fname)).read()
total = open(fname2).read()#open(path.join(d, fname)).read()

datadf = pd.read_csv('LIWC2015.csv', header = None)
countDict = defaultdict(int)
count2Dict = defaultdict(int)
pctDict = defaultdict(int)
difDict = defaultdict(int)

with open("NLPMaybe/logLiwc.txt", "a") as myfile:
    myfile.write("\n" + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + " LIWC Analysis ran!")


for index, row in datadf.iterrows():
  try:
    pattern = re.compile(row[0], re.IGNORECASE)
    countDict[row[1]] += len(re.findall(pattern, subset))
    count2Dict[row[1]] += len(re.findall(pattern, total))
  except:
    pass;
  
count = len(subset.split(" "));
count2 = len(total.split(" "));


for k in countDict.keys():
  pctDict[k] = countDict[k]/float(count)
  difDict[k] =  pctDict[k] - count2Dict[k]/float(count2)


# for i in sorted( ((v,k) for k,v in pctDict.iteritems()), reverse=True):
#   print(i[1] + ": " + str(i[0]))
# for i in sorted( ((v,k) for k,v in difDict.iteritems()), reverse=True):
#   print(i[1] + ": " + str(i[0]))
helper = [];
for k in sorted(pctDict, key = pctDict.get, reverse = True):  
  print(k + "++" + str(pctDict.get(k)) + "++" + str(difDict.get(k)))
  helper.append([k,pctDict.get(k), difDict.get(k)])

toCSV = pd.DataFrame(helper)
toCSV.columns = ['']



