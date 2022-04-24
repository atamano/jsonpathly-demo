import { Container, Typography } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import 'ace-builds/src-noconflict/ace';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';
import { query } from 'jsonpathly';
import { ChangeEvent, useEffect, useState } from 'react';
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

export default function App() {
  const [result, setResult] = useState('');
  const [input, setInput] = useState(JSON.stringify(DEFAULT_INPUT, null, 2));
  const [jsonPath, setJsonPath] = useState(`$.store.book[?(@.price>20 || @.category == 'reference')]`);

  const onInputChange = (text: string) => {
    setInput(text);
  };

  const onJsonPathChange = (event: ChangeEvent<HTMLInputElement>) => {
    setJsonPath(event.target.value);
  };

  useEffect(() => {
    try {
      const res = query(JSON.parse(input), jsonPath);
      setResult(JSON.stringify(res, null, 2));
    } catch (e) {
      setResult('');
      console.log(e);
    }
  }, [input, jsonPath]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container>
        <Typography mt={2} variant="h4">
          JsonPathly Editor
        </Typography>
        <Stack my={3}>
          <TextField label="JSON Path" onChange={onJsonPathChange} value={jsonPath} />
        </Stack>
        <Grid container component="main" sx={{ height: '80vh' }}>
          <Grid item xs={6}>
            <AceEditor mode="json" theme="monokai" onChange={onInputChange} value={input} />
          </Grid>
          <Grid item xs={6}>
            <AceEditor mode="json" theme="monokai" value={result} />
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}
