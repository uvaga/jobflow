import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <h1>JobFlow Frontend</h1>
        <p>React 18 + TypeScript + Vite</p>
      </div>
    </ThemeProvider>
  );
}

export default App;
