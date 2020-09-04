#!/bin/bash

prefix="../etl/output/annotated/"

for f in $(ls $prefix*.ndjson);
do
 table=${f%.ndjson};
 table=${table#$prefix};
 echo "TABLE $table";
 sqlite3 bulk.db "create table $table(json);";  sqlite3 bulk.db ".import $f $table";
done

sqlite3 bulk.db ".read  dm-example-sqlite.sql"
