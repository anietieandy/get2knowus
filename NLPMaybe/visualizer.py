#!/usr/bin/env python2
'''
Informative Dirichlet Prior Log-Odds Ratio Class
'''

from collections import Counter
import sys
import math
import codecs
import pandas as pd
from nltk.tokenize import sent_tokenize, regexp_tokenize
import argparse

LAMBDA = 0

def generate_tokens(text1, text2):
	tokens1 = [regexp_tokenize(t, '\w+\'*\w*') for t in sent_tokenize(text1)]
	tokens2 = [regexp_tokenize(t, '\w+\'*\w*') for t in sent_tokenize(text2)]
	return (tokens1, tokens2)

def get_default_phrasifier():
    return Phrasifier('wiki_title_2grams.tsv')

class Phrasifier():
    '''
    Takes the path to a TSV of word1<TAB>word2,
    representing phrases.
    Returns an object that takes sentence lists and
    returns phrasified sentence lists.
    '''
    phrases = set()

    def __init__(self, filepath):
        for line in codecs.open(filepath, 'r', 'utf-8'):
            line = [x.strip() for x in line.split('\t')]
            self.phrases.add((line[0], line[1]))
    '''
    Takes a list of sentences,
    yields a flattened list of phrases.
    '''
    def phrases_of_sents(self, sentence_list):
        for sent in sentence_list:
            buf = []
            for word in sent:
                if len(buf) == 2:
                    if tuple(buf) in self.phrases:
                        words = tuple(buf)
                        buf = [word]
                        yield '_'.join(words)
                    else:
                        buf.append(word)
                        yield buf.pop(0)
                else:
                    buf.append(word)
            if len(buf) == 2:
                if tuple(buf) in self.phrases:
                    yield '_'.join(buf)
                else:
                    for word in buf:
                        yield word


'''
Log-odds algorithm on lists of words
'''
def get_analysis(one_words, two_words, a):
    one_words = filter( lambda x: len(x) != 1, [x.lower() for x in one_words])
    two_words = filter( lambda x: len(x) != 1, [x.lower() for x in two_words])
    
    y_i = Counter(one_words)
    y_j = Counter(two_words)
    y = Counter(two_words)
    y.update(one_words)

    n = float(sum(y.values()))
    n_i = float(sum(y_i.values()))
    n_j = float(sum(y_j.values()))
    
    a.update(y)
    a_0 = float(sum(a.values()))

    delta = {w:
            math.log( (y_i[w] + a[w]) / float(n_i + a_0 - y_i[w] - a[w]) ) - 
            math.log( (y_j[w] + a[w]) / float(n_j + a_0 - y_j[w] - a[w]) )
            for w in y}
    sigma = {w:
            math.sqrt(1.0/(y_i[w] + a[w]) + 1.0/(n_i + a_0 - y_i[w] - a[w]) +
                      1.0/(y_j[w] + a[w]) + 1.0/(n_j + a_0 - y_i[w] - a[w]))
            for w in y}
        
    zscores_freqs = {w:
            (delta[w]/sigma[w], y[w], y_i[w], y_j[w])for w in y}
    return zscores_freqs





#if __name__ == '__main__':
out1 = open('output1.txt').read().decode('utf-8')
out2 = open('output2.txt').read().decode('utf-8')
tokens1,tokens2 = generate_tokens(out1, out2)
phrasifier = get_default_phrasifier()
phrases1 = list(phrasifier.phrases_of_sents(tokens1))
phrases2 = list(phrasifier.phrases_of_sents(tokens2))

counter = Counter()
for line in codecs.open('small_phrase_corpus_tok2', 'r', 'utf-8'):
    words = [x.strip() for x in line.split()]
    counter.update(words)
    
results = get_analysis(phrases1, phrases2, counter)
sortedResults = sorted(results.items(), key=lambda x:x[1][0])
sortedResults = {'scores':(sortedResults[:10], sortedResults[-10:])}
for word in sorted(results, key=lambda x: -results[x][0]):
    print word + '\t' + str(results[word])
print(sortedResults)

    

