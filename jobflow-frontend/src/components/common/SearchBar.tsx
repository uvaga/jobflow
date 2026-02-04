import { useState, useCallback, FormEvent } from 'react';
import { Paper, InputBase, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
}

export default function SearchBar({
  onSearch,
  placeholder = 'Search...',
  defaultValue = '',
  disabled = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      onSearch(query.trim());
    },
    [query, onSearch],
  );

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
  }, [onSearch]);

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
      }}
      elevation={2}
    >
      <IconButton
        type="submit"
        sx={{ p: '10px' }}
        aria-label="search"
        disabled={disabled}
      >
        <SearchIcon />
      </IconButton>
      <InputBase
        sx={{ ml: 1, flex: 1 }}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={disabled}
        inputProps={{ 'aria-label': placeholder }}
      />
      {query && (
        <IconButton
          sx={{ p: '10px' }}
          aria-label="clear"
          onClick={handleClear}
          disabled={disabled}
        >
          <ClearIcon />
        </IconButton>
      )}
    </Paper>
  );
}
