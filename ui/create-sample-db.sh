#!/bin/bash

prefix="../etl/output/annotated/"
db="./public/bulk.db"

rm -f $db

for f in $(ls $prefix*.ndjson);
do
 table=${f%.ndjson};
 table=${table#$prefix};
 echo "TABLE $table";
 sqlite3 $db "create table $table(json);";  sqlite3 $db ".import $f $table";
done
