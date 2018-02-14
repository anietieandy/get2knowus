
from __future__ import print_function
import sys
import pandas as pd
import numpy as np
from pprint import pprint
from time import time
import logging
import json
from sklearn.datasets import fetch_20newsgroups
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_extraction.text import TfidfTransformer
from sklearn.linear_model import SGDClassifier
from sklearn.model_selection import GridSearchCV
from sklearn.pipeline import Pipeline
from pymongo import MongoClient  # pymongo>=3.2



#############################################################################
# Define a pipeline combining a text feature extractor with a simple
# classifier

pipeline = Pipeline([
    ('vect', CountVectorizer()),
    ('tfidf', TfidfTransformer()),
    ('clf', SGDClassifier()),
])

parameters = {
    'vect__max_df': (0.5, 0.75, 1.0),
    'vect__ngram_range': ((1, 1), (1, 2)),  # unigrams or bigrams
    'clf__alpha': (0.00001, 0.000001),
    'clf__penalty': ('l2', 'elasticnet'),
}

if __name__ == "__main__":

    if len(sys.argv) > 1: 
        path = sys.argv[1]
        input0 = []
        with open(path) as f:
            for line in f:
                input0.append(line)
    else: 
        input0 = ["I\'m a dad", 'I\'m a daddy, looking for a little girl who is 18', 'When I\'m a dad i will use this']

    data = json.load(open('credentials.json'))

    ########## database connection ###############
    uri = 'mongodb://' + data['MLAB_USERNAME']+ ':' + data['MLAB_PASSWORD'] + '@ds221228.mlab.com:21228/' + data['MLAB_DB_NAME']
    client = MongoClient(uri)
    db = client.get_default_database()
    classifications = db['classifications']
    queries = db.classifications.find({'query': 'Im a dad'})
    if queries.count() < 500:
        print('##########')
        ones = [1 for i in input0]
        print ('[' + " ".join(map(str,ones)).strip() + ']')
    else:
        d = []
        for doc in queries:
            d.append({'body': doc['post'], 'classification': doc['valid']})
        dbData = pd.DataFrame(d, columns = ['body', 'classification'])
        dbData.classification = dbData.classification.astype(int)
        # print (dbData.head(10))
    ################################################


        # datadf = pd.read_csv('Classyfications.csv')
        # datadf.body = datadf.body.apply(lambda x : unicode(x, errors='replace'))
        datadf = dbData

        data_new = list(datadf.body)
        data_target = np.array(datadf.classification)
        
        
        grid_search = GridSearchCV(pipeline, parameters, n_jobs=-1, verbose=1)
        # pprint(parameters)
        # t0 = time()
        grid_search.fit(data_new, data_target)
    #    print("done in %0.3fs" % (time() - t0))
    #    print()
    #    
    #    print("Best score: %0.3f" % grid_search.best_score_)
    #    print("Best parameters set:")
        best_parameters = grid_search.best_estimator_.get_params()
    #    for param_name in sorted(parameters.keys()):
    #        print("\t%s: %r" % (param_name, best_parameters[param_name]))
            
        results = grid_search.predict(input0)
        print('##########')
        print(results)
            
            
