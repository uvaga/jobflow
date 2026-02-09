import {useState, useCallback, type FormEvent, useEffect} from 'react';
import {Paper, InputBase, IconButton} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import {useDebounce} from '@/hooks/useDebounce';

interface SearchBarProps {
    value: string,
    onChange: (query: string) => void,
    onSubmit?: () => void,
    placeholder?: string,
    disabled?: boolean,
    debounceMs?: number
}

export default function SearchBar({
                                      value,
                                      onChange,
                                      onSubmit,
                                      placeholder = 'Search...',
                                      disabled = false,
                                      debounceMs = 1000
                                  }: SearchBarProps) {
    // Internal state for instant UI feedback
    const [localValue, setLocalValue] = useState(value);

    // Debounce the value before notifying parent
    const debouncedValue = useDebounce(localValue, debounceMs);

    // Sync local state when external value changes (e.g., URL navigation)
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // Notify parent only after debounce
    useEffect(() => {
        if (debouncedValue !== value) {
            onChange(debouncedValue);
        }
    }, [debouncedValue]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmit = useCallback(
        (e: FormEvent) => {
            e.preventDefault();
            // Submit current value immediately (bypass debounce)
            if (localValue !== value) {
                onChange(localValue);
            }
            onSubmit?.();
        },
        [localValue, value, onChange, onSubmit],
    );

    const handleClear = useCallback(() => {
        setLocalValue('');
        onChange('');
    }, [onChange]);

    const handleChange = useCallback((newValue: string) => {
        setLocalValue(newValue);
    }, []);

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
                sx={{p: '10px'}}
                aria-label="search"
                disabled={disabled}
            >
                <SearchIcon/>
            </IconButton>
            <InputBase
                sx={{ml: 1, flex: 1}}
                placeholder={placeholder}
                value={localValue}
                onChange={(e) => handleChange(e.target.value)}
                disabled={disabled}
                inputProps={{'aria-label': placeholder}}
            />
            {localValue && (
                <IconButton
                    sx={{p: '10px'}}
                    aria-label="clear"
                    onClick={handleClear}
                    disabled={disabled}
                >
                    <ClearIcon/>
                </IconButton>
            )}
        </Paper>
    );
}
