# get2knowus
CIS400 Project Fall 2017 - Spring 2018

Our application can be used to analyze reddit posts by groups of people. On the first page, you will type in a query in the form of “I’m a _____” where the underlined blank is the group you would like to search for. Examples of this include “I’m a dad”, “I’m a vegetarian”, and “I’m a student”. Then, you have the option to either classify or analyze. Before being brought to the respective screens, you will have the option to add similar search queries if similar queries exist. For example, if the search was “I’m a teacher”, a similar query would be “I’m an instructor”. If the suggested queries are accurate, you can choose to add them to the group you would like to analyze/classify.


If you choose the “Classify” option, you will be brought to a screen of random results from the query you inputted. You can either classify these as accurate or inaccurate and this will be reflected in a database for future reference.


If you choose the “Analyze” option, you will be brought to a general analysis page. This consists of tone sentiment by IBM’s BlueMix API, a histogram to reflect that data, and two word clouds that show relative and absolute frequencies of words used by the search group. In addition to that, we show the posts we queried and used to provide the analysis. Post level BlueMix results are displayed if the analyze button on each post is pressed. All of these posts can be downloaded for use outside of the application.


The next tab is a “Deep-Dive” option that allows you to explore specific words used by the group you are analyzing. It will provide information regarding posts made by this group that mention the given word or phrase. This feature gives the absolute sentiment numbers provided by the BlueMix API as well as calculated LIWC scores for the various roots present in the post. This data can be download and used outside of the application.


The final tab is a “Cross-Group Analysis” feature that allows you to compare two groups of individuals. Type in two user groups as “I’m a ____” and the application uses log odds ratio to identify and compare the most frequently used words by these two groups.



Note: To get started, first fork your own copy of the project and take a look at credentials.json, to fill in all the relevant credentials with your own personal accounts.

API Keys:
BlueMix API is located here: https://www.ibm.com/watson/developercloud/tone-analyzer/api/v3/curl.html?curl#versioning
Create an account and a new instance. You will have to input the service credentials into the code in order for the API to work. At the free tier, you are allowed 2500 API calls per month.

To host the database, we use MLab (https://mlab.com/). We suggest setting up your own MLab instance.

Then, set up a virtual environment on your computer (we used conda).

############ Install python
(run from Root)
conda create -n cis400 --file req.txt
source activate cis400

...And you're all set! 
