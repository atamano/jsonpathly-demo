import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  FormGroup,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import { Collapse } from '@mui/material';
import 'ace-builds/src-noconflict/ace';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-one_dark';
import * as jsonpathly from 'jsonpathly';
import * as jsonpathPlus from 'jsonpath-plus';
import * as jsonpath from 'jsonpath';

import { SyntheticEvent, ChangeEvent, useEffect, useState } from 'react';
import AceEditor from 'react-ace';

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const DEFAULT_INPUT = {
  store: {
    book: [
      {
        category: 'reference',
        author: 'Nigel Rees',
        title: 'Sayings of the Century',
        price: 8.95,
      },
      {
        category: 'fiction',
        author: 'Evelyn Waugh',
        title: 'Sword of Honour',
        price: 12.99,
      },
      {
        category: 'fiction',
        author: 'Herman Melville',
        title: 'Moby Dick',
        isbn: '0-553-21311-3',
        price: 8.99,
      },
      {
        category: 'fiction',
        author: 'J. R. R. Tolkien',
        title: 'The Lord of the Rings',
        isbn: '0-395-19395-8',
        price: 22.99,
      },
    ],
    bicycle: {
      color: 'red',
      price: 19.95,
    },
  },
  expensive: 10,
};

const PATH_ITEMS = [
  ['$', 'the root object/element'],
  ['@', 'the current object/element'],
  ['.', 'or []	child operator'],
  ['..', 'recursive descent. JSONPath borrows this syntax from E4X.'],
  ['*', 'wildcard. All objects/elements regardless their names.'],
  [
    '[]',
    'subscript operator. XPath uses it to iterate over element collections and for predicates. In Javascript and JSON it is the native array operator.',
  ],
  [
    '[,]',
    'Union operator in XPath results in a combination of node sets. JSONPath allows alternate names or array indices as a set.',
  ],
  ['[start:end:step]', 'array slice operator borrowed from ES4.'],
  ['?()', 'applies a filter (script) expression.'],
  ['()', 'script expression, using the underlying script engine. (not handled by Jsonpathly for security reasons)'],
];

const EXAMPLES = [
  ['$.store.book[*].author', 'The authors of all books'],
  ['$..author', 'All authors'],
  ['$.store.*', 'All things, both books and bicycles'],
  ['$.store..price', 'The price of everything'],
  ['$..book[2]', 'The third book'],
  ['$..book[-2]', 'The second to last book'],
  ['$..book[0,1]', 'The first two books'],
  ['$..book[:2]', 'All books from index 0 (inclusive) until index 2 (exclusive)'],
  ['$..book[1:2]', 'All books from index 1 (inclusive) until index 2 (exclusive)'],
  ['$..book[-2:]', 'Last two books'],
  ['$..book[2:]', 'Book number two from tail'],
  ['$..book[?(@.isbn)]', 'All books with an ISBN number'],
  ['$.store.book[?(@.price < 10)]', 'All books in store cheaper than 10'],
  [`$..book[?(@.price <= $['expensive'])]`, `All books in store that are not 'expensive'`],
  ['$..book[?(@.author =~ /.*REES/i)]', 'All books matching regex (ignore case)'],
  ['$..*', 'Give me every thing'],
];

const JSONPathTable = ({
  onClick,
  headers,
  rows,
}: {
  onClick?: (t: string) => void;
  headers: string[];
  rows: string[][];
}) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          {headers.map((header) => (
            <TableCell key={header}>{header}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map(([path, desc]) => (
          <TableRow onClick={onClick ? () => onClick(path) : undefined} key={path}>
            <TableCell style={onClick ? { cursor: 'pointer', color: '#58a6ff' } : undefined}> {path}</TableCell>
            <TableCell>{desc}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

enum TABS {
  JSONPathly,
  JSONPathPlus,
  JSONPath,
}

export default function App() {
  const [collapse, setCollapse] = useState(true);
  const [isArray, setIsArray] = useState(true);
  const [tab, setTab] = useState(TABS.JSONPathly);
  const [result, setResult] = useState('');
  const [input, setInput] = useState(JSON.stringify(DEFAULT_INPUT, null, 2));
  const [jsonPath, setJsonPath] = useState(`$..book[?(@.price <= $['expensive'])]`);

  const onInputChange = (text: string) => {
    setInput(text);
  };

  const onJsonPathChange = (event: ChangeEvent<HTMLInputElement>) => {
    setJsonPath(event.target.value);
  };

  useEffect(() => {
    try {
      const parsedInput = JSON.parse(input);
      switch (tab) {
        case TABS.JSONPathly: {
          const res = jsonpathly.query(parsedInput, jsonPath, { returnArray: isArray });
          setResult(JSON.stringify(res, null, 2));
          break;
        }
        case TABS.JSONPath: {
          const res = jsonpath.query(parsedInput, jsonPath);
          setResult(JSON.stringify(res, null, 2));
          break;
        }
        case TABS.JSONPathPlus: {
          const res = jsonpathPlus.JSONPath({ path: jsonPath, json: parsedInput, wrap: isArray });
          setResult(JSON.stringify(res, null, 2));
          break;
        }
      }
    } catch (e) {
      setResult('');
      console.log(e);
    }
  }, [tab, isArray, input, jsonPath]);

  const onTabChange = (_event: SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container>
        <Typography mt={2} variant="h4">
          JsonPath Evaluator
        </Typography>
        <Stack mt={3}>
          <TextField label="JSON Path" onChange={onJsonPathChange} value={jsonPath} />
        </Stack>
        <Box my={1}>
          <Grid container component="main" spacing={4}>
            <Grid item xs={12} md={6}>
              <Box height={45}>
                <FormGroup>
                  <FormControlLabel
                    control={<Checkbox checked={isArray} onClick={() => setIsArray(!isArray)} />}
                    label="Always use array (Jsonpathly + JSonpath plus)"
                  />
                </FormGroup>
              </Box>
              <AceEditor width="100%" mode="json" theme="one_dark" onChange={onInputChange} value={input} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Tabs value={tab} onChange={onTabChange} aria-label="basic tabs example">
                  <Tab label="JsonPathly" onClick={() => setTab(TABS.JSONPathly)} />
                  <Tab label="JsonPath Plus" onClick={() => setTab(TABS.JSONPathPlus)} />
                  <Tab label="JsonPath (dchester)" onClick={() => setTab(TABS.JSONPath)} />
                </Tabs>
              </Box>
              <AceEditor width="100%" mode="json" theme="one_dark" value={result} />
            </Grid>
          </Grid>
        </Box>
        <Box my={3}>
          <Typography variant="h4">JsonPath Examples</Typography>
          <Typography my={2}>Click on the path to change the editor</Typography>
          <JSONPathTable
            onClick={(value) => {
              setJsonPath(value);
              window.scrollTo(0, 0);
            }}
            headers={['JSONPath', 'Description']}
            rows={EXAMPLES}
          />
        </Box>
        <Box my={3}>
          <Button onClick={() => setCollapse(!collapse)}>View syntax</Button>
          <Collapse in={!collapse} timeout="auto" unmountOnExit>
            <Typography my={2} variant="h4">
              JsonPath Syntax
            </Typography>
            <JSONPathTable headers={['JSONPath', 'Description']} rows={PATH_ITEMS} />
          </Collapse>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
