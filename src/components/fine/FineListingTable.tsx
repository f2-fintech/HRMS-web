import React, { useMemo } from 'react'
import { Box, Avatar, Button, Accordion, AccordionSummary, AccordionDetails, Table, TableHead, TableRow, TableBody, Typography, TableCell, Chip } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DeleteIcon from '@mui/icons-material/Delete'
import { DriveFileRenameOutlineOutlined, CurrencyRupee, CalendarToday, Info } from '@mui/icons-material'
import { format } from 'date-fns'

import Loader from '@/components/loader/loader'
import { StyledTableCell } from '@components/fine/StyledTableCell'

interface FineListingTableProps {
    loading: boolean
    userRole: string
    fines: any[]
    total: number
    page: number
    limit: number
    onPageChange: (params: { page: number; pageSize: number }) => void
    onConfirmDelete: (id: string) => void
    onEditFine: (id: string) => void
}

const FineListingTable: React.FC<FineListingTableProps> = ({
    loading,
    userRole,
    fines,
    total,
    page,
    limit,
    onPageChange,
    onConfirmDelete,
    onEditFine,
}) => {
    const generateColumns = (): GridColDef[] => {
        /**
         * For role === '1', we display an accordion of "Fine Details".
         * Otherwise, display simple columns.
         */
        if (userRole === '1') {
            return [
                {
                    field: 'fine',
                    headerName: 'Fine Details',
                    flex: 1,
                    headerAlign: 'center',
                    headerClassName: 'super-app-theme--header',
                    renderCell: (params) => {
                        return (
                            <Box width="100%">
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Box
                                            display="flex"
                                            alignItems="center"
                                            height="100%"
                                            width="100%"
                                            justifyContent="space-between"
                                        >
                                            {/* Employee Info */}
                                            <Box display="flex" alignItems="center" width="33%">
                                                <Avatar
                                                    src={params.row.employee.image}
                                                    sx={{ marginLeft: 2, width: 30, height: 30 }}
                                                />
                                                <Typography
                                                    sx={{
                                                        fontSize: '1em',
                                                        fontWeight: 'bold',
                                                        textTransform: 'capitalize',
                                                        marginLeft: 2
                                                    }}
                                                >
                                                    {params.row.employee.first_name}{' '}
                                                    {params.row.employee.last_name}
                                                </Typography>
                                            </Box>
                                            {/* Total */}
                                            <Box
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="center"
                                                width="33%"
                                            >
                                                <Typography sx={{ fontSize: '1em' }}>
                                                    Total: ₹
                                                    {Array.isArray(params.row.assets)
                                                        ? params.row.assets
                                                            .reduce((total, asset) => {
                                                                const fineAmount = asset.fineAmount
                                                                    ? parseFloat(asset.fineAmount)
                                                                    : 0
                                                                return total + fineAmount
                                                            }, 0)
                                                            .toLocaleString()
                                                        : '0'}
                                                </Typography>
                                            </Box>
                                            {/* View all */}
                                            <Box
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="flex-end"
                                                width="33%"
                                            >
                                                <Typography sx={{ fontSize: '1em' }}>
                                                    {`View all Fines (${Array.isArray(params.row.assets)
                                                        ? params.row.assets.length
                                                        : 0
                                                        })`}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ marginTop: 2 }}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <StyledTableCell>Fine Type</StyledTableCell>
                                                    <StyledTableCell>Fine Amount</StyledTableCell>
                                                    <StyledTableCell>Fine Date</StyledTableCell>
                                                    <StyledTableCell>Edit</StyledTableCell>
                                                    <StyledTableCell>Delete</StyledTableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {Array.isArray(params.row.assets) &&
                                                    params.row.assets.map((fine: any, idx: number) => (
                                                        <TableRow key={`fine-${idx}`}>
                                                            <TableCell>{fine.fineType}</TableCell>
                                                            <TableCell>
                                                                ₹{fine.fineAmount?.toLocaleString()}
                                                            </TableCell>
                                                            <TableCell>
                                                                {fine.fineDate
                                                                    ? format(
                                                                        new Date(fine.fineDate),
                                                                        'dd-MMM-yyyy'
                                                                    ).toUpperCase()
                                                                    : ''}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    variant="contained"
                                                                    sx={{
                                                                        minWidth: '50px',
                                                                        backgroundColor: '#2c3ce3',
                                                                        '&:hover': { backgroundColor: '#1a237e' }
                                                                    }}
                                                                    onClick={() => onEditFine(fine._id)}
                                                                >
                                                                    <DriveFileRenameOutlineOutlined />
                                                                </Button>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    color="error"
                                                                    variant="contained"
                                                                    sx={{ minWidth: '50px' }}
                                                                    onClick={() => onConfirmDelete(fine._id)}
                                                                >
                                                                    <DeleteIcon />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>
                                    </AccordionDetails>
                                </Accordion>
                            </Box>
                        )
                    },
                },
            ]
        }

        // If userRole > 1
        return [
            {
                field: 'fineType',
                headerName: 'Fine Type',
                flex: 1,
                headerClassName: 'super-app-theme--header',
                renderCell: (params) => (
                    <Box display="flex" alignItems="center" gap={1}>
                        <Info sx={{ color: '#2c3ce3', fontSize: 20 }} />
                        <Chip
                            label={params.value}
                            sx={{
                                fontWeight: 600,
                                '&:hover': {
                                    backgroundColor: '#bbdefb'
                                }
                            }}
                        />
                    </Box>
                ),
            },
            {
                field: 'fineAmount',
                headerName: 'Fine Amount',
                flex: 1,
                headerClassName: 'super-app-theme--header',
                renderCell: (params) => (
                    <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                    >
                        <CurrencyRupee sx={{ color: '#7b1fa2' }} />
                        <span style={{ color: '#7b1fa2', fontWeight: 600 }}>
                            {typeof params.value === 'number'
                                ? params.value.toLocaleString('en-IN')
                                : params.value}
                        </span>
                    </Box>
                ),
            },
            {
                field: 'fineDate',
                headerName: 'Fine Date',
                flex: 1,
                headerClassName: 'super-app-theme--header',
                renderCell: (params) => (
                    <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                    >
                        <CalendarToday sx={{ color: '#2e7d32' }} />
                        <span style={{ color: '#2e7d32', fontWeight: 600 }}>
                            {params.value
                                ? format(new Date(params.value), 'dd MMM yyyy')
                                : 'N/A'}
                        </span>
                    </Box>
                ),
            },
        ]
    }

    const columns = useMemo(() => generateColumns(), [userRole])

    return (
        <Box sx={{ width: '100%' }}>
            <DataGrid
                // autoHeight
                loading={loading}
                getRowHeight={() => 'auto'}
                sx={{
                    height: 'calc(140vh - 200px)',
                    '& .super-app-theme--header': {
                        fontSize: 17,
                        fontWeight: 600,
                        alignItems: 'center',
                    },
                    '& .mui-yrdy0g-MuiDataGrid-columnHeaderRow ': {
                        background: '#2c3ce3 !important',
                        color: 'white',
                    },
                    '& .MuiDataGrid-cell': {
                        fontSize: '10',
                        align: 'center',
                    },
                    '& .MuiDataGrid-row': {
                        '&:nth-of-type(odd)': {
                            backgroundColor: 'rgb(46 38 61 / 12%)',
                        },
                        '&:nth-of-type(even)': {
                            backgroundColor: '#fffff',
                        },
                        fontWeight: '600',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                    },
                }}
                slots={{
                    loadingOverlay: Loader,
                }}
                rows={fines}
                columns={columns}
                pageSizeOptions={[10, 20, 30]}
                paginationMode='server'
                rowCount={total}
                getRowId={(row) => {
                    // For admin (role=1), sometimes row._id could be nested
                    if (userRole === '1') {
                        return row._id && row._id._id ? row._id._id : row._id
                    }
                    return row._id
                }}
                paginationModel={{ page: page - 1, pageSize: limit }}
                onPaginationModelChange={onPageChange}
            />
        </Box>
    )
}

export default FineListingTable
