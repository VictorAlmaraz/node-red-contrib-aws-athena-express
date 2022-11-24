# Runs a query on AWS Athena. Based on [athena-express](https://www.npmjs.com/package/athena-express)
    
### Inputs

: payload (string) :  the query to be executed
: db (string)          :  the name of the Athena database to run query
: s3 (string) : S3 buckets where query results are stored. athena-express will create a new bucket for you if you don't provide a value for this param


### Outputs

1. Standard output
: payload (object) : query results
    