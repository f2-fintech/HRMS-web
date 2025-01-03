import React, { useState, useEffect } from 'react'

import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem } from '@mui/material'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import type { Break } from '@/redux/features/breaksheets/breaksSlice'

interface EditBreakFormProps {
    open: boolean
    onClose: () => void
    onSubmit: (updatedBreak: Break) => void
    breakToEdit: Break | null
}

const breakOptions = ['Washroom', 'Lunch', 'Refreshment', 'Tea', 'Personal Call', 'Other'];

const EditBreakForm: React.FC<EditBreakFormProps> = ({ open, onClose, onSubmit, breakToEdit }) => {
    const [formValues, setFormValues] = useState({
        type: '',
        startTime: new Date(),
        endTime: new Date(),
        duration: ''
    })

    const [otherBreakType, setOtherBreakType] = useState<string>('')

    useEffect(() => {
        if (breakToEdit) {
            const currentDate = new Date();
            const start = new Date(`${currentDate.toDateString()} ${breakToEdit.startTime}`);
            const end = new Date(`${currentDate.toDateString()} ${breakToEdit.endTime}`);

            setFormValues({
                type: breakToEdit.type || '',
                startTime: start,
                endTime: end,
                duration: breakToEdit.duration || '',
            })

            if (!breakOptions.includes(breakToEdit.type)) {
                setOtherBreakType(breakToEdit.type);
                setFormValues(prevState => ({ ...prevState, type: 'Other' }));
            }
        }
    }, [breakToEdit])

    useEffect(() => {
        if (formValues.startTime && formValues.endTime) {
            const durationInMs = formValues.endTime.getTime() - formValues.startTime.getTime();

            if (durationInMs >= 0) {
                const durationDate = new Date(durationInMs);
                const hours = durationDate.getUTCHours();
                const minutes = durationDate.getUTCMinutes();
                const seconds = durationDate.getUTCSeconds();
                const durationString = `${hours}h ${minutes}m ${seconds}s`;

                setFormValues(prevState => ({
                    ...prevState,
                    duration: durationString,
                }));
            }
        }
    }, [formValues.startTime, formValues.endTime]);

    const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;

        setFormValues(prevState => ({
            ...prevState,
            type: value,
        }));
    }

    const handleOtherTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOtherBreakType(e.target.value);
    }

    const handleTimeChange = (name: string, value: Date | null) => {
        if (value) {
            setFormValues(prevState => ({
                ...prevState,
                [name]: value,
            }));
        }
    }

    const handleSubmit = () => {
        if (breakToEdit) {
            const finalBreakType = formValues.type === 'Other' ? otherBreakType : formValues.type;

            onSubmit({
                ...breakToEdit,
                type: finalBreakType,
                startTime: formValues.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
                endTime: formValues.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
                duration: formValues.duration,
            });
        }
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Edit Break</DialogTitle>
                <DialogContent>
                    <TextField
                        select
                        label="Break Type"
                        name="type"
                        value={formValues.type}
                        onChange={handleTypeChange}
                        fullWidth
                        margin="normal"
                    >
                        {breakOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>

                    {formValues.type === 'Other' && (
                        <TextField
                            label="Please specify"
                            value={otherBreakType}
                            onChange={handleOtherTypeChange}
                            fullWidth
                            margin="normal"
                        />
                    )}

                    <TimePicker
                        label="Start Time"
                        value={formValues.startTime}
                        onChange={(value) => handleTimeChange('startTime', value)}
                        renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                        ampm
                        timeSteps={{ minutes: 1 }} // Customizing the minutes interval to show every minute
                    />

                    <TimePicker
                        sx={{ ml: '1rem' }}
                        label="End Time"
                        value={formValues.endTime}
                        onChange={(value) => handleTimeChange('endTime', value)}
                        renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                        ampm
                        timeSteps={{ minutes: 1 }} // Customizing the minutes interval to show every minute
                    />

                    <TextField
                        label="Duration"
                        value={formValues.duration}
                        fullWidth
                        margin="normal"
                        disabled
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} color="secondary">
                        Update
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    )
}

export default EditBreakForm
