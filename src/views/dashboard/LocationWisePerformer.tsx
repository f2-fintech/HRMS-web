import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import { motion } from 'framer-motion';

import { utility } from '@/utility';
import { apiResponse } from '@/utility/apiResponse/employeesResponse';
import { fetchAwards, addAward } from '@/redux/features/performer/performereSlice';
import type { AppDispatch, RootState } from '@/redux/store';

import AwardForm from '@/components/performer/AwardForm';
import { formatAmount } from '@/utility/formatAmount/formatAmount';

const LocationWisePerformer = () => {
  const dispatch: AppDispatch = useDispatch();
  const { awards, loading, error } = useSelector((state: RootState) => state.awards);

  const [selectedAwardIndex, setSelectedAwardIndex] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [awardTitle, setAwardTitle] = useState('');

  const [user, setUser] = useState<{ id: string; designation: string; role: string } | null>(null);

  const { capitalizeFirstLetter } = utility();

  // Fetch user details and employees on component mount
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(storedUser);

    const fetchEmployees = async () => {
      try {
        const data = await apiResponse();
        setEmployees(data);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };

    fetchEmployees();
    dispatch(fetchAwards());
  }, [dispatch]);

  const handleMenuClick = (index: number) => {
    setSelectedAwardIndex(index);

    if (awards[index]) {
      setIsEditMode(true);
      const award = awards[index];
      const employee = employees.find(
        (emp) => emp._id === (award.employee?._id || award.employee)
      );

      setSelectedEmployee(employee || null);
      setAmount(award.amount?.toString() || '');
      setAwardTitle(award.awardTitle || '');
    } else {
      setIsEditMode(false);
      setSelectedEmployee(null);
      setAmount('');
      setAwardTitle('');
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const url =
        isEditMode && selectedAwardIndex !== null
          ? `${process.env.NEXT_PUBLIC_APP_URL}/awards/${awards[selectedAwardIndex]._id}`
          : `${process.env.NEXT_PUBLIC_APP_URL}/awards`;

      const method = isEditMode && selectedAwardIndex !== null ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee: selectedEmployee ? selectedEmployee._id : '',
          amount: amount,
          awardTitle: awardTitle,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newAward = await response.json();

      if (isEditMode) {
        dispatch(fetchAwards());
      } else {
        dispatch(addAward({ ...newAward, employee: selectedEmployee }));
      }
    } catch (error) {
      console.error('Error saving award:', error);
    }

    setSelectedAwardIndex(null);
  };

  const handleCloseForm = () => {
    setSelectedAwardIndex(null);
  };

  return (
    <Box
      position="relative"
      sx={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
        // padding: '20px'
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          sx={{
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            background: 'rgba(255,255,255,0.9)'
          }}
        >
          <CardContent>
            {loading && (
              <Typography
                variant="h6"
                color="textSecondary"
                align="center"
                sx={{ padding: '20px' }}
              >
                Loading awards...
              </Typography>
            )}
            {error && (
              <Typography
                color="error"
                align="center"
                sx={{ padding: '20px' }}
              >
                {error}
              </Typography>
            )}

            <Box
              display="flex"
              flexDirection="column"
              gap={4}
            >
              {[...awards, ...new Array(3 - awards.length).fill(null)].map((award, index) => (
                <motion.div
                  key={award ? award._id : index}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    sx={{
                      borderRadius: '12px',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)'
                      }
                    }}
                  >
                    <CardContent
                      sx={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        height: '35vh',
                        background: 'linear-gradient(145deg, #f4f6f9 0%, #e9edf3 100%)'
                      }}
                    >
                      {/* Header with Location */}
                      <Box
                        mb={2}
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        {/* Employee Image */}
                        {award?.employee?.image && (
                          <motion.img
                            src={award.employee.image}
                            alt={`${award.employee.first_name} ${award.employee.last_name}`}
                            style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '50%',
                              border: '3px solid #1976d2',
                              objectFit: 'cover'
                            }}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}

                        {/* Location */}
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            flexGrow: 1,
                            textAlign: 'center',
                            color: '#1976d2',
                            letterSpacing: '1px'
                          }}
                        >
                          {award?.employee?.location || '---'}
                        </Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between" width="100%">
                        {/* Award Information */}
                        <div>
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 500,
                              color: '#333',
                              marginBottom: 1
                            }}
                          >
                            {award?.employee ? (
                              <>
                                {user?.id === award.employee._id
                                  ? 'Congratulations'
                                  : 'Congratulate'}{' '}
                                <span
                                  style={{
                                    fontWeight: 'bold',
                                    color: '#1976d2'
                                  }}
                                >
                                  {capitalizeFirstLetter(award.employee.first_name)}{' '}
                                  {capitalizeFirstLetter(award.employee.last_name)}
                                </span>
                                ! 🎉
                              </>
                            ) : (
                              'No Award Data'
                            )}
                          </Typography>
                          {award?.employee && (
                            <Typography
                              sx={{
                                fontWeight: 'normal',
                                color: '#7e57c2',
                                fontStyle: 'italic',
                                marginTop: '4px',
                              }}
                            >
                              {award.employee.designation}
                            </Typography>
                          )}
                          <Typography
                            variant="h6"
                            sx={{
                              fontSize: '1rem',
                              marginTop: '8px',
                              wordWrap: 'break-word',
                              wordBreak: 'break-all',
                              color: '#555'
                            }}
                          >
                            {award?.awardTitle || 'Best seller of the month'}
                          </Typography>
                        </div>

                        {/* Add/Edit Button */}
                        {(user?.designation === 'Sr. Operation Manager' || user?.role === '1') && (
                          <Tooltip title="Add/Edit">
                            <IconButton
                              onClick={() => handleMenuClick(index)}
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                zIndex: 10,
                                background: 'rgba(25,118,210,0.1)',
                                '&:hover': {
                                  background: 'rgba(25,118,210,0.2)'
                                }
                              }}
                            >
                              <MoreVertIcon color="primary" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>

                      {/* Award Amount */}
                      <Typography
                        variant="h5"
                        color="primary"
                        sx={{
                          wordWrap: 'break-word',
                          wordBreak: 'break-all',
                          fontWeight: 'bold',
                          marginTop: 'auto'
                        }}
                      >
                        {award?.amount ? formatAmount(award.amount) : 'N/A'}
                      </Typography>

                      <motion.img
                        src="/images/pages/trophy.png"
                        alt="trophy"
                        style={{
                          height: 80,
                          position: 'absolute',
                          right: 20,
                          bottom: 20,
                          opacity: 0.7
                        }}
                        initial={{ rotate: -10 }}
                        animate={{
                          rotate: [0, -5, 0, 5, 0],
                          transition: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }
                        }}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Award Form */}
      {selectedAwardIndex !== null && (
        <AwardForm
          employees={employees}
          selectedEmployee={selectedEmployee}
          amount={amount}
          awardTitle={awardTitle}
          setAwardTitle={setAwardTitle}
          isEditMode={isEditMode}
          onSubmit={handleFormSubmit}
          onClose={handleCloseForm}
          setSelectedEmployee={setSelectedEmployee}
          setAmount={setAmount}
        />
      )}
    </Box>
  );
};

export default LocationWisePerformer;
