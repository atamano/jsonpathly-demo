import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Container,
  FormControlLabel,
  Grid,
  Link,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import 'ace-builds/src-noconflict/ace';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-one_dark';
import * as jsonpath from 'jsonpath';
import { JSONPath } from 'jsonpath-plus';
import * as jsonpathly from 'jsonpathly';
import { type KeyboardEvent, useEffect, useMemo, useState } from 'react';
import AceEditor from 'react-ace';

import logo from './logo.png';

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const DEFAULT_PATH = '$.store.book[*].author';

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
  ['$', 'The root object/element'],
  ['@', 'The current object/element'],
  ['. or []', 'Child operator'],
  ['..', 'Recursive descent. JSONPath borrows this syntax from E4X.'],
  ['*', 'Wildcard. All objects/elements regardless of their names.'],
  [
    '[]',
    'Subscript operator. XPath uses it to iterate over element collections and for predicates. In JavaScript and JSON it is the native array operator.',
  ],
  [
    '[,]',
    'Union operator. In XPath it results in a combination of node sets. JSONPath allows alternate names or array indices as a set.',
  ],
  ['[start:end:step]', 'Array slice operator borrowed from ES4.'],
  ['?()', 'Applies a filter (script) expression.'],
  ['()', 'Script expression, using the underlying script engine (not handled by Jsonpathly for security reasons).'],
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
  ['$..book[2:]', 'All books from index 2 (inclusive) to the end'],
  ['$..book[?(@.isbn)]', 'All books with an ISBN number'],
  ['$.store.book[?(@.price < 10)]', 'All books in store cheaper than 10'],
  [`$..book[?(@.price <= $['expensive'])]`, `All books in store that are not 'expensive'`],
  ['$..book[?(@.author =~ /.*REES/i)]', 'All books matching regex (ignore case)'],
  ['$..*', 'Give me everything'],
];

const LIBRARIES = [
  { id: 'jsonpathly', label: 'JsonPathly', url: 'https://github.com/atamano/jsonpathly' },
  { id: 'jsonpath-plus', label: 'JsonPath Plus', url: 'https://github.com/JSONPath-Plus/JSONPath' },
  { id: 'jsonpath', label: 'JsonPath (dchester)', url: 'https://github.com/dchester/jsonpath' },
] as const;

type LibraryId = (typeof LIBRARIES)[number]['id'];
type OutputMode = 'values' | 'paths';

type Failure = { ok: false; error: string };
type Evaluation = { ok: true; value: unknown } | Failure;
type Result = { ok: true; text: string; matches: number } | Failure;

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

function evaluate(library: LibraryId, json: unknown, path: string, mode: OutputMode, alwaysArray: boolean): unknown {
  switch (library) {
    case 'jsonpathly':
      return mode === 'paths'
        ? jsonpathly.paths(json, path)
        : jsonpathly.query(json, path, { returnArray: alwaysArray });
    case 'jsonpath-plus':
      return JSONPath({
        path,
        json: json as object,
        wrap: mode === 'paths' ? true : alwaysArray,
        resultType: mode === 'paths' ? 'path' : 'value',
        // Never fall back to native eval: paths can come from a shared link.
        eval: 'safe',
      });
    case 'jsonpath':
      return mode === 'paths'
        ? jsonpath.paths(json, path).map((p) => jsonpath.stringify(p))
        : jsonpath.query(json, path);
  }
}

const readPathFromUrl = () => new URLSearchParams(window.location.search).get('path');

const JSONPathTable = ({ onSelect, rows }: { onSelect?: (path: string) => void; rows: string[][] }) => (
  <TableContainer component={Paper}>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>JSONPath</TableCell>
          <TableCell>Description</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map(([path, desc]) => (
          <TableRow
            key={path}
            hover={!!onSelect}
            {...(onSelect && {
              role: 'button',
              tabIndex: 0,
              onClick: () => onSelect(path),
              onKeyDown: (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(path);
                }
              },
              sx: { cursor: 'pointer' },
            })}
          >
            <TableCell sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap', color: onSelect ? 'primary.light' : undefined }}>
              {path}
            </TableCell>
            <TableCell>{desc}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const EDITOR_HEIGHT = '500px';

export default function App() {
  const [showSyntax, setShowSyntax] = useState(false);
  const [alwaysArray, setAlwaysArray] = useState(true);
  const [mode, setMode] = useState<OutputMode>('values');
  const [library, setLibrary] = useState<LibraryId>('jsonpathly');
  const [input, setInput] = useState(() => JSON.stringify(DEFAULT_INPUT, null, 2));
  const [urlPath] = useState(readPathFromUrl);
  const [jsonPath, setJsonPath] = useState(urlPath ?? DEFAULT_PATH);
  // A path from a shared link is untrusted until the user edits it: only Jsonpathly
  // (which never evaluates scripts) runs it. The other engines evaluate filters with eval-like sandboxes.
  const [pathTrusted, setPathTrusted] = useState(urlPath === null);

  const updatePath = (path: string) => {
    setJsonPath(path);
    setPathTrusted(true);
  };

  // Keep the current path in the URL so it can be shared.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (jsonPath === DEFAULT_PATH) url.searchParams.delete('path');
    else url.searchParams.set('path', jsonPath);
    window.history.replaceState(null, '', url);
  }, [jsonPath]);

  const parsedInput = useMemo<Evaluation>(() => {
    try {
      return { ok: true, value: JSON.parse(input) };
    } catch (e) {
      return { ok: false, error: `Invalid JSON: ${errorMessage(e)}` };
    }
  }, [input]);

  const result = useMemo<Result>(() => {
    if (!parsedInput.ok) return parsedInput;
    if (!jsonPath.trim()) return { ok: false, error: 'Enter a JSONPath expression' };
    if (!pathTrusted && library !== 'jsonpathly') {
      return { ok: false, error: 'This path comes from a shared link. Edit it to run it with this library.' };
    }
    // Each run gets its own copy: filter expressions can mutate the document (e.g. `@.sort()`).
    const run = (runMode: OutputMode, runAlwaysArray: boolean) =>
      evaluate(library, structuredClone(parsedInput.value), jsonPath, runMode, runAlwaysArray);
    try {
      const value = run(mode, alwaysArray);
      // An unwrapped result can't be counted from its shape (a single match may itself be an array).
      const alwaysWrapped = mode === 'paths' || alwaysArray || library === 'jsonpath';
      const matches = alwaysWrapped ? (value as unknown[]).length : (run('values', true) as unknown[]).length;
      // Serialize here so that a circular result shows an error instead of crashing the render.
      return { ok: true, text: JSON.stringify(value, null, 2) ?? 'undefined', matches };
    } catch (e) {
      return { ok: false, error: errorMessage(e) };
    }
  }, [parsedInput, library, jsonPath, pathTrusted, mode, alwaysArray]);

  const resultText = result.ok ? result.text : '';
  const matchCount = result.ok ? result.matches : 0;
  const currentLibrary = LIBRARIES.find((l) => l.id === library)!;

  const formatInput = () => {
    if (parsedInput.ok) setInput(JSON.stringify(parsedInput.value, null, 2));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container sx={{ pb: 6 }}>
        <Stack direction="row" spacing={2} sx={{ mt: 3, alignItems: 'center' }}>
          <img width={56} height={56} src={logo} alt="Jsonpathly logo" />
          <Box>
            <Typography variant="h4" component="h1">
              JSONPath Editor
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Test JSONPath expressions with{' '}
              <Link href="https://github.com/atamano/jsonpathly" target="_blank" rel="noopener">
                Jsonpathly
              </Link>{' '}
              and compare with other libraries
            </Typography>
          </Box>
        </Stack>

        <TextField
          fullWidth
          sx={{ mt: 3 }}
          label="JSONPath"
          value={jsonPath}
          onChange={(e) => updatePath(e.target.value)}
          error={parsedInput.ok && !result.ok}
          slotProps={{ htmlInput: { spellCheck: false, style: { fontFamily: 'monospace' } } }}
        />

        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack direction="row" sx={{ height: 48, alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1">Input JSON</Typography>
              <Button size="small" onClick={formatInput} disabled={!parsedInput.ok}>
                Format
              </Button>
            </Stack>
            <AceEditor
              width="100%"
              height={EDITOR_HEIGHT}
              mode="json"
              theme="one_dark"
              name="input-editor"
              onChange={setInput}
              value={input}
              tabSize={2}
              setOptions={{ useWorker: false }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Tabs value={library} onChange={(_e, value: LibraryId) => setLibrary(value)} variant="scrollable">
              {LIBRARIES.map((lib) => (
                <Tab key={lib.id} value={lib.id} label={lib.label} />
              ))}
            </Tabs>
            <AceEditor
              width="100%"
              height={EDITOR_HEIGHT}
              mode="json"
              theme="one_dark"
              name="result-editor"
              value={resultText}
              readOnly
              showPrintMargin={false}
              setOptions={{ useWorker: false }}
            />
          </Grid>
        </Grid>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2, alignItems: { sm: 'center' } }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={mode}
            onChange={(_e, value: OutputMode | null) => value && setMode(value)}
          >
            <ToggleButton value="values">Values</ToggleButton>
            <ToggleButton value="paths">Paths</ToggleButton>
          </ToggleButtonGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={alwaysArray}
                onChange={(e) => setAlwaysArray(e.target.checked)}
                disabled={mode === 'paths' || library === 'jsonpath'}
              />
            }
            label="Always return an array"
          />
          <Box sx={{ flexGrow: 1 }} />
          {result.ok && <Chip label={`${matchCount} match${matchCount === 1 ? '' : 'es'}`} variant="outlined" />}
          <Link href={currentLibrary.url} target="_blank" rel="noopener" variant="body2">
            {currentLibrary.label} on GitHub
          </Link>
        </Stack>

        {!result.ok && (
          <Alert severity="error" sx={{ mt: 2, fontFamily: 'monospace' }}>
            {result.error}
          </Alert>
        )}

        <Box component="section" sx={{ mt: 5 }}>
          <Typography variant="h5" component="h2">
            Examples
          </Typography>
          <Typography color="text.secondary" sx={{ my: 1 }}>
            Click a path to try it
          </Typography>
          <JSONPathTable
            rows={EXAMPLES}
            onSelect={(path) => {
              updatePath(path);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </Box>

        <Box component="section" sx={{ mt: 4 }}>
          <Button onClick={() => setShowSyntax((s) => !s)}>{showSyntax ? 'Hide syntax' : 'View syntax'}</Button>
          <Collapse in={showSyntax} timeout="auto" unmountOnExit>
            <Typography variant="h5" component="h2" sx={{ my: 2 }}>
              JSONPath Syntax
            </Typography>
            <JSONPathTable rows={PATH_ITEMS} />
          </Collapse>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
