import { useCallback, useState, useEffect, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Divider,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AddIcon from '@mui/icons-material/Add';

import {
  useSavedVacancyDetail,
  useRefreshSavedVacancy,
  useRemoveVacancy,
  useUpdateSavedVacancyProgress,
  useUpdateSavedVacancyNotes,
  useUpdateSavedVacancyChecklist,
} from '@/hooks/useVacancies';
import ProgressStatusChip from '@/components/features/ProgressStatusChip';
import { VacancyProgressStatus } from '@/types/vacancyProgress';
import type { ChecklistItem } from '@/types';
import { normalizeFromDb } from '@/utils/vacancyNormalizer';
import { formatDate, formatDateTime } from '@/utils/vacancyHelpers';
import {
  VacancyDetailSkeleton,
  VacancyHeaderInfo,
  KeySkillsSection,
  DescriptionSection,
  AdditionalInfoSection,
} from '@/components/features/vacancy-detail';
import ConfirmDialog from '@/components/common/ConfirmDialog';

const statusOptions = Object.values(VacancyProgressStatus);
const NOTES_MAX_LENGTH = 2000;
const CHECKLIST_MAX_ITEMS = 50;
const CHECKLIST_ITEM_MAX_LENGTH = 200;

// ── Notes Section (isolated state) ────────────────────────────────

interface NotesSectionProps {
  hhId: string;
  serverNotes: string;
}

const NotesSection = memo(function NotesSection({ hhId, serverNotes }: NotesSectionProps) {
  const notesMutation = useUpdateSavedVacancyNotes();
  const [localNotes, setLocalNotes] = useState(serverNotes);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      setLocalNotes(serverNotes);
      setInitialized(true);
    }
  }, [serverNotes, initialized]);

  const notesChanged = localNotes !== serverNotes;

  const handleSave = useCallback(() => {
    notesMutation.mutate({ hhId, notes: localNotes });
  }, [hhId, localNotes, notesMutation]);

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Notes
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <TextField
        multiline
        minRows={3}
        maxRows={10}
        fullWidth
        placeholder="Add your personal notes about this vacancy..."
        value={localNotes}
        onChange={(e) => setLocalNotes(e.target.value)}
        slotProps={{
          htmlInput: { maxLength: NOTES_MAX_LENGTH },
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {localNotes.length}/{NOTES_MAX_LENGTH}
        </Typography>
        <Button
          variant="contained"
          size="small"
          onClick={handleSave}
          disabled={!notesChanged || notesMutation.isPending}
        >
          {notesMutation.isPending ? 'Saving...' : 'Save Notes'}
        </Button>
      </Box>
    </Paper>
  );
});

// ── Checklist Section (isolated state) ────────────────────────────

interface ChecklistSectionProps {
  hhId: string;
  serverChecklist: ChecklistItem[];
}

const ChecklistSection = memo(function ChecklistSection({ hhId, serverChecklist }: ChecklistSectionProps) {
  const checklistMutation = useUpdateSavedVacancyChecklist();
  const [localChecklist, setLocalChecklist] = useState<ChecklistItem[]>(serverChecklist);
  const [initialized, setInitialized] = useState(false);
  const [newItemText, setNewItemText] = useState('');

  useEffect(() => {
    if (!initialized) {
      setLocalChecklist(serverChecklist);
      setInitialized(true);
    }
  }, [serverChecklist, initialized]);

  const saveChecklist = useCallback((items: ChecklistItem[]) => {
    checklistMutation.mutate({ hhId, checklist: items });
  }, [hhId, checklistMutation]);

  const handleToggle = useCallback((index: number) => {
    setLocalChecklist((prev) => {
      const updated = prev.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item,
      );
      saveChecklist(updated);
      return updated;
    });
  }, [saveChecklist]);

  const handleRemove = useCallback((index: number) => {
    setLocalChecklist((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      saveChecklist(updated);
      return updated;
    });
  }, [saveChecklist]);

  const handleAdd = useCallback(() => {
    const text = newItemText.trim();
    if (!text) return;
    setLocalChecklist((prev) => {
      if (prev.length >= CHECKLIST_MAX_ITEMS) return prev;
      const updated = [...prev, { text, checked: false }];
      saveChecklist(updated);
      return updated;
    });
    setNewItemText('');
  }, [newItemText, saveChecklist]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }, [handleAdd]);

  const checkedCount = localChecklist.filter((item) => item.checked).length;

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h5" fontWeight={600}>
          Checklist
        </Typography>
        {localChecklist.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            {checkedCount}/{localChecklist.length} completed
          </Typography>
        )}
      </Box>
      <Divider sx={{ mb: 2 }} />

      {localChecklist.length > 0 && (
        <List dense disablePadding>
          {localChecklist.map((item, index) => (
            <ListItem
              key={index}
              disablePadding
              secondaryAction={
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => handleRemove(index)}
                  aria-label="delete"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
              sx={{ pr: 6 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Checkbox
                  edge="start"
                  checked={item.checked}
                  onChange={() => handleToggle(index)}
                  size="small"
                />
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  textDecoration: item.checked ? 'line-through' : 'none',
                  color: item.checked ? 'text.secondary' : 'text.primary',
                }}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Box sx={{ display: 'flex', gap: 1, mt: localChecklist.length > 0 ? 2 : 0 }}>
        <TextField
          size="small"
          fullWidth
          placeholder={
            localChecklist.length >= CHECKLIST_MAX_ITEMS
              ? `Maximum ${CHECKLIST_MAX_ITEMS} items reached`
              : 'Add a checklist item...'
          }
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={localChecklist.length >= CHECKLIST_MAX_ITEMS}
          slotProps={{
            htmlInput: { maxLength: CHECKLIST_ITEM_MAX_LENGTH },
          }}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disabled={
            !newItemText.trim() ||
            localChecklist.length >= CHECKLIST_MAX_ITEMS
          }
          sx={{ whiteSpace: 'nowrap' }}
        >
          Add
        </Button>
      </Box>
    </Paper>
  );
});

// ── Main Page ─────────────────────────────────────────────────────

export default function SavedVacancyDetail() {
  const { id: hhId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: entry, isPending, isError, error } = useSavedVacancyDetail(hhId);
  const refreshMutation = useRefreshSavedVacancy();
  const removeMutation = useRemoveVacancy();
  const updateProgressMutation = useUpdateSavedVacancyProgress();
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const handleBack = useCallback(() => {
    navigate('/vacancies');
  }, [navigate]);

  const handleRefresh = useCallback(() => {
    if (hhId) refreshMutation.mutate(hhId);
  }, [hhId, refreshMutation]);

  const handleUnsave = useCallback(() => {
    setShowRemoveDialog(true);
  }, []);

  const handleConfirmRemove = useCallback(() => {
    if (hhId) {
      removeMutation.mutate(hhId, {
        onSuccess: () => navigate('/vacancies'),
      });
    }
  }, [hhId, removeMutation, navigate]);

  const handleCancelRemove = useCallback(() => {
    setShowRemoveDialog(false);
  }, []);

  const handleStatusChange = useCallback((e: { target: { value: string } }) => {
    if (hhId && e.target.value) {
      updateProgressMutation.mutate({ hhId, status: e.target.value });
    }
  }, [hhId, updateProgressMutation]);

  if (isPending) return <VacancyDetailSkeleton />;

  if (isError) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
            Back to Saved
          </Button>
          <Alert severity="error">{error?.message || 'Failed to load vacancy details'}</Alert>
        </Box>
      </Container>
    );
  }

  if (!entry) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
            Back to Saved
          </Button>
          <Alert severity="warning">Saved vacancy not found</Alert>
        </Box>
      </Container>
    );
  }

  const rawVacancy = entry.vacancy;
  const progress = entry.progress;
  const currentStatus = progress.at(-1)?.status;
  const savedDate = progress[0]?.statusSetDate;
  const vacancy = normalizeFromDb(rawVacancy);

  return (
    <Container maxWidth="lg">
      <title>{`${vacancy.name} - Saved Vacancy - JobFlow`}</title>
      <Box sx={{ py: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Saved Vacancies
        </Button>

        {/* Header section */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 280 }}>
              {currentStatus && (
                <Box sx={{ mb: 2 }}>
                  <ProgressStatusChip status={currentStatus} size="medium" />
                </Box>
              )}
              <VacancyHeaderInfo vacancy={vacancy} />
            </Box>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 180 }}>
              {vacancy.alternateUrl && (
                <Button
                  variant="contained"
                  size="large"
                  href={vacancy.alternateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<OpenInNewIcon />}
                >
                  View original posting
                </Button>
              )}
              <Tooltip title="Fetch the latest vacancy data">
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  disabled={refreshMutation.isPending}
                >
                  {refreshMutation.isPending ? 'Refreshing...' : 'Refresh vacancy data'}
                </Button>
              </Tooltip>
              <Tooltip title="Permanently remove from saved list">
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleUnsave}
                  disabled={removeMutation.isPending}
                >
                  {removeMutation.isPending ? 'Removing...' : 'Remove from Saved'}
                </Button>
              </Tooltip>
            </Box>
          </Box>

          {/* Dates info */}
          <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {savedDate && (
              <Typography variant="body2" color="text.secondary">
                Saved: {formatDate(savedDate)}
              </Typography>
            )}
            {rawVacancy.updatedAt && (
              <Typography variant="body2" color="text.secondary">
                Last updated: {formatDate(rawVacancy.updatedAt)}
              </Typography>
            )}
            {vacancy.publishedAt && (
              <Typography variant="body2" color="text.secondary">
                Published: {formatDate(vacancy.publishedAt)}
              </Typography>
            )}
          </Box>
        </Paper>

        {/* Progress Management */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Progress
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Box sx={{ mb: 3 }}>
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Update Status</InputLabel>
              <Select
                value=""
                label="Update Status"
                onChange={handleStatusChange}
                disabled={updateProgressMutation.isPending}
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    <ProgressStatusChip status={status} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {progress.length > 0 && (
            <Stack spacing={1}>
              {[...progress].reverse().map((entry, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    pl: 2,
                    borderLeft: '3px solid',
                    borderColor: index === 0 ? 'primary.main' : 'grey.300',
                    py: 0.5,
                  }}
                >
                  <ProgressStatusChip status={entry.status} />
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(entry.statusSetDate)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>

        {hhId && (
          <>
            <NotesSection hhId={hhId} serverNotes={entry.notes ?? ''} />
            <ChecklistSection hhId={hhId} serverChecklist={entry.checklist ?? []} />
          </>
        )}

        <KeySkillsSection skills={vacancy.keySkills} areaId={vacancy.area.id} />
        <DescriptionSection description={vacancy.description} />
        <AdditionalInfoSection vacancy={vacancy} />

        {/* Bottom actions */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
          {vacancy.alternateUrl && (
            <Button
              variant="contained"
              size="large"
              href={vacancy.alternateUrl}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<OpenInNewIcon />}
            >
              View original posting
            </Button>
          )}
          <Button variant="outlined" size="large" onClick={handleBack}>
            Back to Saved Vacancies
          </Button>
        </Box>
      </Box>

      <ConfirmDialog
        open={showRemoveDialog}
        title="Remove Vacancy"
        message="Are you sure you want to remove this vacancy from your saved list? This action cannot be undone."
        confirmText="Remove"
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
        loading={removeMutation.isPending}
      />
    </Container>
  );
}
