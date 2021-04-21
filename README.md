# codemirror-snowsql
This project is to use the lezer-snowsql grammar to add parsing and linting capabilities to codemirror for editing SnowSQL. This branch has an editor built using 
CodeMirror 6 and Lezer parser. It is able to provide linting and autocomplete for the select query of sql. This was built taking inspiration from the CodeMirror-
PromQL github repo. There are still a few PromQL constructs in the code as it is a work in progress. 


## Development
In case you want to contribute and change the code by yourself, run the following commands:
To install all dependencies:
npm install
To start the web server:
npm start
This should create a tab in your browser with the development app that contains CodeMirror Next with the SnowSQL plugin.
## License
[MIT](./LICENSE)
