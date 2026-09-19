'use client'
import React, { useState, useEffect } from 'react'
import {
  Typography,
  Button,
  Box,
  Chip,
  Tabs,
  Tab,
  TextField,
  Divider,
  DialogContent,
  Dialog,
  IconButton
} from '@mui/material'
import { Delete } from '@mui/icons-material';
import { styled } from '@mui/system'
import { Autocomplete } from '@mui/material'
import { Close } from '@mui/icons-material'
import imageCompression from 'browser-image-compression'
import { toast, ToastContainer } from 'react-toastify'

import Loader from '../loader/loader'

import 'react-toastify/dist/ReactToastify.css'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const StyledTabs = styled(Tabs)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main
  }
}))

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.9rem',
  minWidth: 0,
  '&.Mui-selected': {
    color: theme.palette.primary.main
  }
}))

const ProfileForm = ({
  profileId,
  logedUser,
  userData,
  setCalculateFilledTabsCount,
  setCheckVerify
}) => {
  const [tabValue, setTabValue] = useState(0)
  const [updating, setUpdating] = useState(false)
  const [verifyTrigger, setVerifyTrigger] = useState(0)
  const [open, setOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState({ src: null, alt: null })
  const [loading, setLoading] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: '',
    skills: [],
    personalDetails: {

      fatherName: '',
      motherName: '',

      maritalStatus: '',
      bloodGroup: '',

      panCardNumber: '',
      panCardImage: null,

      aadhaarCardNumber: '',
      aadhaarFrontImage: null,
      aadhaarBackImage: null
    },


    bankDetails: { bankName: '', accountNumber: '', ifscCode: '' },
    addressDetails: {
      permanentAddress: '',
      currentAddress: '',

    },
    academics: [{ level: '10th', institution: '', fromYear: '', toYear: '', details: '' }],
    pastExperience: [
      {
        companyName: '',
        fromYear: '',
        toYear: '',
        lastCtc: '',
        designation: '',
        referenceName: '',
        referenceContact: ''
      }
    ],
    verify: false
  })

  const [userRole, setUserRole] = useState('')
  const [userId, setUserId] = useState(null)

  const isFormDisabled = userRole !== '1' && logedUser.id !== profileId

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const handleInputChange = (section, index, field, value) => {
    if (section === 'academics') {
      setFormData(prevData => ({
        ...prevData,
        academics: prevData.academics.map((item, i) => (i === index ? { ...item, [field]: value } : item))
      }))
    } else {
      // For other sections
      setFormData(prevData => ({
        ...prevData,
        [section]: {
          ...prevData[section],
          [field]: value
        }
      }))
    }
  }

  const addAcademic = () => {
    setFormData(prevData => ({
      ...prevData,
      academics: [...prevData.academics, { level: '', institution: '', fromYear: '', toYear: '', details: '' }]
    }))
  }

  const removeAcademic = index => {
    setFormData(prevData => ({
      ...prevData,
      academics: prevData.academics.filter((_, i) => i !== index)
    }))
  }

  const handleFileChange = async (section, field, file) => {
    if (file) {
      const fileSizeInKB = file.size / 1024 // Convert file size from bytes to KB

      // Only compress if file size is greater than 500KB
      if (fileSizeInKB > 500) {
        setIsCompressing(true)
        try {
          const options = {
            maxSizeMB: 0.5, // Target size is 500KB
            maxWidthOrHeight: 1920, // Optional, set max width/height if needed
            useWebWorker: true // Enable web workers for faster compression
          }

          // Compress the file (returns a Blob)
          const compressedBlob = await imageCompression(file, options)

          // Convert compressed Blob back to a File
          const compressedFile = new File([compressedBlob], file.name, {
            type: file.type,
            lastModified: Date.now() // You can adjust this to the original lastModified if needed
          })

          // Update formData with the compressed file
          setFormData(prevFormData => ({
            ...prevFormData,
            [section]: {
              ...prevFormData[section],
              [field]: compressedFile // Use the File object, not Blob
            }
          }))
        } catch (error) {
          console.error('Error compressing the image:', error)
        } finally {
          setIsCompressing(false)
        }
      } else {
        // If the file is already less than or equal to 500KB, use it directly
        setFormData(prevFormData => ({
          ...prevFormData,
          [section]: {
            ...prevFormData[section],
            [field]: file
          }
        }))
        setIsCompressing(false)
      }
    }
  }

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setUserRole(user.role)
    setUserId(user.id)
  }, [])

  useEffect(() => {
    const checkIfExist = async () => {
      try {
        const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/profile/${profileId}`, {
          method: 'GET'
        })

        if (checkResponse.ok) {
          const data = await checkResponse.json()
          setUpdating(true) // Profile exists
          populateFormData(data)
          setCheckVerify(data.verify)
        } else if (checkResponse.status === 404) {
          setUpdating(false) // Profile does not exist
        }
      } catch (error) {
        console.error('Error checking profile existence:', error)
        setUpdating(false)
      }
    }

    if (profileId) {
      checkIfExist()
    }
  }, [profileId, verifyTrigger])

  useEffect(() => {
    setFormData(prevData => ({
      ...prevData,
      employeeId: profileId
    }))
  }, [profileId])

  const populateFormData = data => {
    setFormData({
      employeeId: data.employeeId || '',
      skills: data.skills || [],
      personalDetails: {
        fullName: data.personalDetails?.fullName || '',
        fatherName: data.personalDetails?.fatherName || '',
        motherName: data.personalDetails?.motherName || '',
        email: data.personalDetails?.email || '',
        phoneNumber: data.personalDetails?.phoneNumber || '',
        gender: data.personalDetails?.gender || '',
        dateOfBirth: data.personalDetails?.dateOfBirth || '',
        maritalStatus: data.personalDetails?.maritalStatus || '',
        bloodGroup: data.personalDetails?.bloodGroup || '',
        panCardNumber:
          data.personalDetails?.panCardNumber ||
          data.bankDetails?.panCardNumber ||
          '',
        panCardImage:
          data.personalDetails?.panCardImageUrl ||
          data.bankDetails?.panCardImageUrl,
        aadhaarCardNumber:
          data.personalDetails?.aadhaarCardNumber ||
          data.addressDetails?.aadhaarCardNumber ||
          '',

        aadhaarFrontImage:
          data.personalDetails?.aadhaarFrontImageUrl ||
          data.addressDetails?.aadhaarFrontImageUrl,
        aadhaarBackImage:
          data.personalDetails?.aadhaarBackImageUrl ||
          data.addressDetails?.aadhaarBackImageUrl
      },

      bankDetails: {
        bankName: data.bankDetails?.bankName || '',
        accountNumber:
          data.bankDetails?.accountNumber || '',
        ifscCode: data.bankDetails?.ifscCode || ''
      },

      addressDetails: {
        permanentAddress:
          data.addressDetails?.permanentAddress || '',
        currentAddress:
          data.addressDetails?.currentAddress || ''
      },
      academics: Array.isArray(data.academics)
        ? data.academics
        : [{ level: '10th', institution: '', fromYear: '', toYear: '', details: '' }],
      pastExperience:
        data.pastExperience.length > 0
          ? data.pastExperience
          : [
            {
              companyName: '',
              fromYear: '',
              toYear: '',
              lastCtc: '',
              designation: '',
              referenceName: '',
              referenceContact: ''
            }
          ],
      verify: data.verify
    })
  }

  const handleSubmit = async e => {
    setLoading(true)
    e.preventDefault()

    const formDataToSend = new FormData()

    // Append simple data (strings, numbers)
    const appendData = (key, value) => {
      if (value !== null && value !== undefined && value !== '') {
        formDataToSend.append(key, value)
      }
    }

    appendData('employeeId', formData.employeeId)

    // Append all fields
    appendData('skills', formData.skills.join(',')) // join skills array as a comma-separated string

    Object.entries(formData.bankDetails).forEach(([key, value]) => {
      appendData(`bankDetails_${key}`, value)
    })

    Object.entries(formData.addressDetails).forEach(([key, value]) => {
      appendData(`addressDetails_${key}`, value)
    })
    Object.entries(formData.personalDetails).forEach(
      ([key, value]) => {
        if (
          key !== 'panCardImage' &&
          key !== 'aadhaarFrontImage' &&
          key !== 'aadhaarBackImage'
        ) {
          appendData(`personalDetails_${key}`, value)
        }
      }
    )

    formData.academics.forEach((academic, index) => {
      appendData(`academics_${index}_level`, academic.level)
      appendData(`academics_${index}_institution`, academic.institution)
      appendData(`academics_${index}_fromYear`, academic.fromYear)
      appendData(`academics_${index}_toYear`, academic.toYear)
      appendData(`academics_${index}_details`, academic.details)
    })

    formData.pastExperience.forEach((exp, index) => {
      Object.entries(exp).forEach(([key, value]) => {
        appendData(`pastExperience_${index}_${key}`, value)
      })
    })

    // Only append files if they are selected
    if (formData.personalDetails.panCardImage) {
      appendData(
        'personalDetails_panCardImage',
        formData.personalDetails.panCardImage
      )
    }

    if (formData.personalDetails.aadhaarFrontImage) {
      appendData(
        'personalDetails_aadhaarFrontImage',
        formData.personalDetails.aadhaarFrontImage
      )
    }

    if (formData.personalDetails.aadhaarBackImage) {
      appendData(
        'personalDetails_aadhaarBackImage',
        formData.personalDetails.aadhaarBackImage
      )
    }
    appendData('verify', formData.verify)

    try {
      const url = updating
        ? `${process.env.NEXT_PUBLIC_APP_URL}/profile/updateByProfileId/${profileId}`
        : `${process.env.NEXT_PUBLIC_APP_URL}/profile/create`

      const response = await fetch(url, {
        method: updating ? 'PUT' : 'POST',
        body: formDataToSend
      })

      if (response.ok) {
        toast.success(updating ? 'Profile Updated Successfully!' : 'Profile Created Successfully')
        setVerifyTrigger(prev => prev + 1)
        setLoading(false)
      } else {
        console.error('Failed to submit/update profile')
        setLoading(false)
      }
    } catch (error) {
      console.error('Error submitting/updating profile:', error)
      setLoading(false)
    }
  }
  const downloadExcel = () => {
    const excelData = [
      {
        FullName:
          `${userData?.first_name || ''} ${userData?.last_name || ''}`,

        Email: userData?.email || '',

        Contact: userData?.contact || '',

        Designation: userData?.designation || '',

        EmployeeCode: userData?.code || '',


        Skills: formData.skills.join(', '),

        FatherName: formData.personalDetails.fatherName,
        MotherName: formData.personalDetails.motherName,
        MaritalStatus: formData.personalDetails.maritalStatus,
        BloodGroup: formData.personalDetails.bloodGroup,

        PanNumber: formData.personalDetails.panCardNumber,
        AadhaarNumber:
          formData.personalDetails.aadhaarCardNumber,

        BankName: formData.bankDetails.bankName,
        AccountNumber:
          formData.bankDetails.accountNumber,
        IFSC: formData.bankDetails.ifscCode,

        PermanentAddress:
          formData.addressDetails.permanentAddress,
        CurrentAddress:
          formData.addressDetails.currentAddress,

        Academics: formData.academics
          .map(
            aca =>
              `${aca.level} - ${aca.institution}`
          )
          .join(' | '),

        Experience: formData.pastExperience
          .map(
            exp =>
              `${exp.companyName} (${exp.designation})`
          )
          .join(' | ')
      }
    ]

    const worksheet =
      XLSX.utils.json_to_sheet(excelData)

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Employee Profile'
    )

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    })

    const fileData = new Blob([excelBuffer], {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    })

    saveAs(
      fileData,
      `Employee_Profile_${formData.employeeId}.xlsx`
    )
  }
  const handleVerifyProfile = async val => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/profile/updateByVerifyStatus/${profileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          verify: val
        })
      })

      if (response.ok) {
        setVerifyTrigger(prev => prev + 1)
      } else {
        console.error('Failed to verify profile')
      }
    } catch (error) {
      console.error('Error verifying profile:', error)
    }
  }

  const SectionTitle = ({ iconClass, title }) => (
    <div className='flex items-center space-x-2 mb-2'>
      <i className={`${iconClass} text-xl text-blue-500`}></i>
      <h6 className='text-lg font-semibold text-blue-700'>{title}</h6>
    </div>
  )

  const handleClickOpen = (imageSrc, imageAlt) => {
    setOpen(true)
    setSelectedImage({ src: imageSrc, alt: imageAlt })
  }
  const handleClose = () => {
    setOpen(false)
  }
  const RenderImage = ({ imageSrc, imageAlt }) => (
    <img
      src={imageSrc instanceof File ? URL.createObjectURL(imageSrc) : imageSrc}
      alt={imageAlt}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        marginTop: '8px',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
        cursor: 'pointer'
      }}
    />
  )

  const tabContent = [
    {
      label: 'Skills',
      content: (
        <Autocomplete
          multiple
          freeSolo
          options={[]}
          value={formData.skills}
          onChange={(event, newValue) => setFormData(prev => ({ ...prev, skills: newValue }))}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => <Chip variant='outlined' label={option} {...getTagProps({ index })} />)
          }
          renderInput={params => (
            <TextField
              {...params}
              variant='outlined'
              label='Skills'
              placeholder='Press Enter to Add more skills'
              fullWidth
              disabled={isFormDisabled}
            />
          )}
          disabled={isFormDisabled}
        />
      )
    },
    {
      label: 'Personal Details',
      content: (
        <>


          <TextField
            label='Father Name'
            fullWidth
            margin='normal'
            value={formData.personalDetails.fatherName}
            onChange={e =>
              handleInputChange(
                'personalDetails',
                '',
                'fatherName',
                e.target.value
              )
            }
          />

          <TextField
            label='Mother Name'
            fullWidth
            margin='normal'
            value={formData.personalDetails.motherName}
            onChange={e =>
              handleInputChange(
                'personalDetails',
                '',
                'motherName',
                e.target.value
              )
            }
          />





          <TextField
            label='Marital Status'
            fullWidth
            margin='normal'
            value={formData.personalDetails.maritalStatus}
            onChange={e =>
              handleInputChange(
                'personalDetails',
                '',
                'maritalStatus',
                e.target.value
              )
            }
          />

          <TextField
            label='Blood Group'
            fullWidth
            margin='normal'
            value={formData.personalDetails.bloodGroup}
            onChange={e =>
              handleInputChange(
                'personalDetails',
                '',
                'bloodGroup',
                e.target.value
              )
            }
          />

          <TextField
            label='PAN Number'
            fullWidth
            margin='normal'
            value={formData.personalDetails.panCardNumber}
            onChange={e =>
              handleInputChange(
                'personalDetails',
                '',
                'panCardNumber',
                e.target.value
              )
            }
          />

          <Box sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              component="label"
            >
              Choose PAN File

              <input
                hidden
                type="file"
                onChange={e =>
                  handleFileChange(
                    'personalDetails',
                    'panCardImage',
                    e.target.files[0]
                  )
                }
              />
            </Button>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {formData.personalDetails.panCardImage
                ? formData.personalDetails.panCardImage instanceof File
                  ? formData.personalDetails.panCardImage.name
                  : decodeURIComponent(
                    formData.personalDetails.panCardImage
                      ?.split('/')
                      ?.pop()
                  )
                : 'No file chosen'}
            </Typography>
          </Box>

          <TextField
            label='Aadhaar Number'
            fullWidth
            margin='normal'
            value={formData.personalDetails.aadhaarCardNumber}
            onChange={e =>
              handleInputChange(
                'personalDetails',
                '',
                'aadhaarCardNumber',
                e.target.value
              )
            }
          />
          <Box sx={{ mt: 1, display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>

            <Box>
              <Button variant="outlined" component="label">
                Choose Aadhaar Front File
                <input
                  hidden
                  type='file'
                  onChange={e =>
                    handleFileChange(
                      'personalDetails',
                      'aadhaarFrontImage',
                      e.target.files[0]
                    )
                  }
                />
              </Button>

              <Typography variant="body2" sx={{ mt: 1 }}>
                {formData.personalDetails.aadhaarFrontImage
                  ? formData.personalDetails.aadhaarFrontImage instanceof File
                    ? formData.personalDetails.aadhaarFrontImage.name
                    : decodeURIComponent(
                      formData.personalDetails.aadhaarFrontImage
                        ?.split('/')
                        ?.pop()
                    )
                  : 'No file chosen'}
              </Typography>
            </Box>

            <Box>
              <Button variant="outlined" component="label">
                Choose Aadhaar Back File
                <input
                  hidden
                  type='file'
                  onChange={e =>
                    handleFileChange(
                      'personalDetails',
                      'aadhaarBackImage',
                      e.target.files[0]
                    )
                  }
                />
              </Button>

              <Typography variant="body2" sx={{ mt: 1 }}>
                {formData.personalDetails.aadhaarBackImage
                  ? formData.personalDetails.aadhaarBackImage instanceof File
                    ? formData.personalDetails.aadhaarBackImage.name
                    : decodeURIComponent(
                      formData.personalDetails.aadhaarBackImage
                        ?.split('/')
                        ?.pop()
                    )
                  : 'No file chosen'}
              </Typography>
            </Box>

          </Box>

        </>
      )
    },
    {
      label: 'Bank Details',
      content: (
        <>
          <TextField
            label='Bank Name'
            fullWidth
            margin='normal'
            value={formData.bankDetails.bankName}
            onChange={e => handleInputChange('bankDetails', '', 'bankName', e.target.value)}
            disabled={isFormDisabled}
          />
          <TextField
            label='Account Number'
            fullWidth
            margin='normal'
            value={formData.bankDetails.accountNumber}
            onChange={e => handleInputChange('bankDetails', '', 'accountNumber', e.target.value)}
            disabled={isFormDisabled}
          />
          <TextField
            label='IFSC Code'
            fullWidth
            margin='normal'
            value={formData.bankDetails.ifscCode}
            onChange={e => handleInputChange('bankDetails', '', 'ifscCode', e.target.value)}
            disabled={isFormDisabled}
          />



        </>
      )
    },
    {
      label: 'Address',
      content: (
        <>
          <TextField
            label='Permanent Address'
            fullWidth
            margin='normal'
            multiline
            rows={4}
            value={formData.addressDetails.permanentAddress}
            onChange={e => handleInputChange('addressDetails', '', 'permanentAddress', e.target.value)}
            disabled={isFormDisabled}
          />
          <TextField
            label='Current Address'
            fullWidth
            margin='normal'
            multiline
            rows={4}
            value={formData.addressDetails.currentAddress}
            onChange={e => handleInputChange('addressDetails', '', 'currentAddress', e.target.value)}
            disabled={isFormDisabled}
          />


        </>
      )
    },
    {
      label: 'Academics',
      content: (
        <>
          {formData.academics.map((academic, index) => (
            <Box key={index} sx={{ border: '1px solid #ddd', padding: 2, marginBottom: 2, borderRadius: 2 }}>
              <TextField
                label='Education Level'
                fullWidth
                margin='normal'
                value={academic.level}
                onChange={e => handleInputChange('academics', index, 'level', e.target.value)}
                disabled={isFormDisabled}
              />
              <TextField
                label='Institution'
                fullWidth
                margin='normal'
                value={academic.institution}
                onChange={e => handleInputChange('academics', index, 'institution', e.target.value)}
                disabled={isFormDisabled}
              />
              <TextField
                label='From Year'
                fullWidth
                margin='normal'
                value={academic.fromYear}
                onChange={e => handleInputChange('academics', index, 'fromYear', e.target.value)}
                disabled={isFormDisabled}
              />
              <TextField
                label='To Year'
                fullWidth
                margin='normal'
                value={academic.toYear}
                onChange={e => handleInputChange('academics', index, 'toYear', e.target.value)}
                disabled={isFormDisabled}
              />
              <TextField
                label='Details'
                fullWidth
                margin='normal'
                multiline
                rows={2}
                value={academic.details}
                onChange={e => handleInputChange('academics', index, 'details', e.target.value)}
                disabled={isFormDisabled}
              />
              <Button
                disabled={isFormDisabled}
                variant='outlined'
                color='secondary'
                onClick={() => removeAcademic(index)}
              >
                Remove
              </Button>
            </Box>
          ))}
          <Button disabled={isFormDisabled} variant='contained' color='primary' onClick={addAcademic}>
            Add More Education
          </Button>
        </>
      )
    },
    {
      label: 'Experience',
      content: (
        <>
          {formData.pastExperience.map((exp, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Typography variant='h6' sx={{ mb: 2 }}>
                Experience {index + 1}
              </Typography>
              <TextField
                label='Company Name'
                fullWidth
                margin='normal'
                value={exp.companyName}
                onChange={e => {
                  const newExperience = [...formData.pastExperience]
                  newExperience[index].companyName = e.target.value
                  setFormData(prev => ({ ...prev, pastExperience: newExperience }))
                }}
                disabled={isFormDisabled}
              />
              <TextField
                label='From Year'
                fullWidth
                margin='normal'
                value={exp.fromYear}
                onChange={e => {
                  const newExperience = [...formData.pastExperience]
                  newExperience[index].fromYear = e.target.value
                  setFormData(prev => ({ ...prev, pastExperience: newExperience }))
                }}
                disabled={isFormDisabled}
              />
              <TextField
                label='To Year'
                fullWidth
                margin='normal'
                value={exp.toYear}
                onChange={e => {
                  const newExperience = [...formData.pastExperience]
                  newExperience[index].toYear = e.target.value
                  setFormData(prev => ({ ...prev, pastExperience: newExperience }))
                }}
                disabled={isFormDisabled}
              />
              <TextField
                label='Last CTC in (Rupees)'
                type='number'
                fullWidth
                margin='normal'
                value={exp.lastCtc}
                onChange={e => {
                  const newExperience = [...formData.pastExperience]
                  newExperience[index].lastCtc = e.target.value
                  setFormData(prev => ({ ...prev, pastExperience: newExperience }))
                }}
                disabled={isFormDisabled}
              />
              <TextField
                label='Designation'
                fullWidth
                margin='normal'
                value={exp.designation}
                onChange={e => {
                  const capitalizedDesignation = e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1)
                  const newExperience = [...formData.pastExperience]
                  newExperience[index].designation = capitalizedDesignation
                  setFormData(prev => ({ ...prev, pastExperience: newExperience }))
                }}
                disabled={isFormDisabled}
              />
              <TextField
                label='Reference Name'
                fullWidth
                margin='normal'
                value={exp.referenceName}
                onChange={e => {
                  const newExperience = [...formData.pastExperience]
                  newExperience[index].referenceName = e.target.value
                  setFormData(prev => ({ ...prev, pastExperience: newExperience }))
                }}
                disabled={isFormDisabled}
              />
              <TextField
                label='Reference Contact'
                fullWidth
                margin='normal'
                value={exp.referenceContact}
                onChange={e => {
                  const newExperience = [...formData.pastExperience]
                  newExperience[index].referenceContact = e.target.value
                  setFormData(prev => ({ ...prev, pastExperience: newExperience }))
                }}
                disabled={isFormDisabled}
              />
            </Box>
          ))}
          <Button
            variant='outlined'
            onClick={() =>
              setFormData(prev => ({
                ...prev,
                pastExperience: [
                  ...prev.pastExperience,
                  {
                    companyName: '',
                    fromYear: '',
                    toYear: '',
                    lastCtc: '',
                    designation: '',
                    referenceName: '',
                    referenceContact: ''
                  }
                ]
              }))
            }
            disabled={isFormDisabled}
          >
            Add More Experience
          </Button>
        </>
      )
    },
    {
      label: logedUser.id === profileId ? 'Preview & Submit' : 'Preview',
      content: (
        <div className='p-6 rounded-lg shadow-lg max-w-2xl mx-auto'>
          <h4 className='text-center mb-6 text-2xl font-bold'>Preview</h4>

          <div className='space-y-6'>
            <section>
              <SectionTitle iconClass='ri-user-3-line' title='Skills' />
              <p >{formData.skills.join(', ') || 'No skills added'}</p>
            </section>
            <section>
              <SectionTitle
                iconClass='ri-user-line'
                title='Personal Details'
              />

              <div className='grid grid-cols-2 gap-2'>


                <p>
                  Father Name:{' '}
                  {formData.personalDetails.fatherName || 'N/A'}
                </p>

                <p>
                  Mother Name:{' '}
                  {formData.personalDetails.motherName || 'N/A'}
                </p>





                <p>
                  Marital Status:{' '}
                  {formData.personalDetails.maritalStatus || 'N/A'}
                </p>

                <p>
                  Blood Group:{' '}
                  {formData.personalDetails.bloodGroup || 'N/A'}
                </p>

                <p>
                  PAN Number:{' '}
                  {formData.personalDetails.panCardNumber || 'N/A'}
                </p>

                <p>
                  Aadhaar Number:{' '}
                  {formData.personalDetails.aadhaarCardNumber || 'N/A'}
                </p>
              </div>

              <div className='flex gap-4 flex-wrap mt-4'>
                {formData.personalDetails.panCardImage && (
                  <Box>
                    <Typography variant='subtitle2'>
                      PAN Card
                    </Typography>

                    <img
                      src={
                        formData.personalDetails.panCardImage instanceof
                          File
                          ? URL.createObjectURL(
                            formData.personalDetails.panCardImage
                          )
                          : formData.personalDetails.panCardImage
                      }
                      alt='PAN'
                      style={{
                        width: '100px',
                        height: '100px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    />
                  </Box>
                )}

                {formData.personalDetails.aadhaarFrontImage && (
                  <Box>
                    <Typography variant='subtitle2'>
                      Aadhaar Front
                    </Typography>

                    <img
                      src={
                        formData.personalDetails
                          .aadhaarFrontImage instanceof File
                          ? URL.createObjectURL(
                            formData.personalDetails
                              .aadhaarFrontImage
                          )
                          : formData.personalDetails
                            .aadhaarFrontImage
                      }
                      alt='Aadhaar Front'
                      style={{
                        width: '100px',
                        height: '100px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    />
                  </Box>
                )}

                {formData.personalDetails.aadhaarBackImage && (
                  <Box>
                    <Typography variant='subtitle2'>
                      Aadhaar Back
                    </Typography>

                    <img
                      src={
                        formData.personalDetails
                          .aadhaarBackImage instanceof File
                          ? URL.createObjectURL(
                            formData.personalDetails
                              .aadhaarBackImage
                          )
                          : formData.personalDetails
                            .aadhaarBackImage
                      }
                      alt='Aadhaar Back'
                      style={{
                        width: '100px',
                        height: '100px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    />
                  </Box>
                )}
              </div>
            </section>

            <hr className='border-t border-gray-200' />

            <hr className='border-t border-gray-200' />

            <section>
              <SectionTitle iconClass='ri-bank-card-line' title='Bank Details' />
              <div className='grid grid-cols-2 gap-2'>
                <p>Bank Name: {formData.bankDetails.bankName || 'N/A'}</p>
                <p>Account Number: {formData.bankDetails.accountNumber || 'N/A'}</p>
                <p>IFSC Code: {formData.bankDetails.ifscCode || 'N/A'}</p>
                {/* <p>PAN Card Number: {formData.personalDetails.panCardNumber || 'N/A'}</p> */}
              </div>
              {/* {formData.personalDetails.panCardImage && (
                <Box sx={{ mt: 2, pl: 2 }}>
                  <Typography variant='subtitle2'>PAN Card Image:</Typography>
                  <img
                    src={
                      formData.personalDetails.panCardImage instanceof File
                        ? URL.createObjectURL(formData.personalDetails.panCardImage)
                        : formData.personalDetails.panCardImage
                    }
                    alt='PAN Card'
                    style={{
                      width: '100px',
                      height: '100px',
                      objectFit: 'cover',
                      marginTop: '8px',
                      borderRadius: '4px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                    }}
                    onClick={() => handleClickOpen(formData.personalDetails.panCardImage, 'PAN Card')}
                  />
                  <IconButton
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        personalDetails: {
                          ...prev.personalDetails,
                          panCardImage: null // Clear the image
                        }
                      }));
                    }}
                    sx={{ marginLeft: '8px' }}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              )} */}
            </section>

            <hr className='border-t border-gray-200' />

            <section>
              <SectionTitle iconClass='ri-map-pin-2-line' title='Address Details' />
              <p >Permanent Address: {formData.addressDetails.permanentAddress || 'N/A'}</p>
              <p >Current Address: {formData.addressDetails.currentAddress || 'N/A'}</p>
              {/* <p >Aadhaar Card Number: {formData.addressDetails.aadhaarCardNumber || 'N/A'}</p> */}
              {/* <div className='flex space-x-4 mt-2'>
                {formData.addressDetails.aadhaarFrontImage && (
                  <Box sx={{ mt: 2, pl: 2 }}>
                    <Typography variant='subtitle2'>Aadhaar Front Image:</Typography>
                    <img
                      src={
                        formData.addressDetails.aadhaarFrontImage instanceof File
                          ? URL.createObjectURL(formData.addressDetails.aadhaarFrontImage)
                          : formData.addressDetails.aadhaarFrontImage
                      }
                      alt='Aadhaar Front'
                      style={{
                        width: '100px',
                        height: '100px',
                        objectFit: 'cover',
                        marginTop: '8px',
                        borderRadius: '4px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                      }}
                      onClick={() => handleClickOpen(formData.addressDetails.aadhaarFrontImage, 'Aadhaar Front')}
                    />
                    <IconButton
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          addressDetails: {
                            ...prev.addressDetails,
                            aadhaarFrontImage: null // Clear the image
                          }
                        }));
                      }}
                      sx={{ marginLeft: '8px' }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                )}
                {formData.addressDetails.aadhaarBackImage && (
                  <Box sx={{ mt: 2, pl: 2 }}>
                    <Typography variant='subtitle2'>Aadhaar Back Image:</Typography>
                    <img
                      src={
                        formData.addressDetails.aadhaarBackImage instanceof File
                          ? URL.createObjectURL(formData.addressDetails.aadhaarBackImage)
                          : formData.addressDetails.aadhaarBackImage
                      }
                      alt='Aadhaar Back'
                      style={{
                        width: '100px',
                        height: '100px',
                        objectFit: 'cover',
                        marginTop: '8px',
                        borderRadius: '4px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                      }}
                      onClick={() => handleClickOpen(formData.addressDetails.aadhaarBackImage, 'Aadhaar Back')}
                    />
                    <IconButton
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          addressDetails: {
                            ...prev.addressDetails,
                            aadhaarBackImage: null // Clear the image
                          }
                        }));
                      }}
                      sx={{ marginLeft: '8px' }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                )}
              </div> */}
            </section>

            <hr className='border-t border-gray-200' />

            <section>
              <SectionTitle iconClass='ri-book-open-line' title='Academics' />
              <div className='grid grid-cols-2 gap-2'>
                {formData.academics.map(aca => {
                  return (
                    <>
                      <p>
                        <b>{aca.level} Details: </b>
                      </p>
                      <p>{aca.institution}</p>
                      <p>{aca.details}</p>
                      <p>
                        {aca.toYear}-{aca.fromYear}
                      </p>
                    </>
                  )
                })}
              </div>
            </section>

            <hr className='border-t border-gray-200' />

            <section>
              <SectionTitle iconClass='ri-briefcase-4-line' title='Past Experience' />
              {formData.pastExperience.length > 0 ? (
                <div className='space-y-4'>
                  {formData.pastExperience.map((exp, index) => (
                    <div key={index} className='p-3 rounded-md'>
                      <p>
                        <b>Company Name: </b>
                        {exp.companyName || 'N/A'}
                      </p>
                      <p className='text-sm'>
                        {exp.fromYear || 'N/A'} - {exp.toYear || 'N/A'}
                      </p>
                      <p>
                        <b>Last CTC: </b>
                        {exp.lastCtc || 'N/A'}
                      </p>
                      <p>
                        <b>Designation: </b>
                        {exp.designation || 'N/A'}
                      </p>
                      <p>
                        <b>Exp. Reference Name: </b>
                        {exp.referenceName || 'N/A'}
                      </p>
                      <p>
                        <b>Exp. Reference Contact: </b>
                        {exp.referenceContact || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p >No past experience added</p>
              )}
            </section>
          </div>

          {(logedUser.id === profileId || userRole === '1') && (
            <Button
              onClick={handleSubmit}
              disabled={isCompressing || loading}
              className='w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300'
            >
              {isCompressing ? 'Wait Compressing Images...' : updating ? 'Update' : 'Submit'}
            </Button>

          )}
        </div>
      )
    }
  ]

  const calculateFilledTabs = () => {
    let filledCount = 0

    // Skills
    filledCount += Math.min(formData.skills.length, 3) / 3

    // Personal Details
    if (formData.personalDetails.fatherName)
      filledCount += 1 / 9

    if (formData.personalDetails.motherName)
      filledCount += 1 / 9

    if (formData.personalDetails.panCardNumber)
      filledCount += 1 / 9

    if (formData.personalDetails.panCardImage)
      filledCount += 1 / 9

    if (formData.personalDetails.aadhaarCardNumber)
      filledCount += 1 / 9

    if (formData.personalDetails.aadhaarFrontImage)
      filledCount += 1 / 9

    if (formData.personalDetails.aadhaarBackImage)
      filledCount += 1 / 9

    if (formData.personalDetails.bloodGroup)
      filledCount += 1 / 9

    if (formData.personalDetails.maritalStatus)
      filledCount += 1 / 9

    // Bank Details
    if (formData.bankDetails.bankName)
      filledCount += 1 / 3

    if (formData.bankDetails.accountNumber)
      filledCount += 1 / 3

    if (formData.bankDetails.ifscCode)
      filledCount += 1 / 3

    // Address
    if (formData.addressDetails.permanentAddress)
      filledCount += 1 / 2

    if (formData.addressDetails.currentAddress)
      filledCount += 1 / 2

    // Academics
    if (formData.academics.some(aca => aca.level))
      filledCount += 1 / 5

    if (formData.academics.some(aca => aca.institution))
      filledCount += 1 / 5

    if (formData.academics.some(aca => aca.fromYear))
      filledCount += 1 / 5

    if (formData.academics.some(aca => aca.toYear))
      filledCount += 1 / 5

    if (formData.academics.some(aca => aca.details))
      filledCount += 1 / 5

    // Experience
    if (formData.pastExperience.some(exp => exp.companyName))
      filledCount += 1 / 7

    if (formData.pastExperience.some(exp => exp.fromYear))
      filledCount += 1 / 7

    if (formData.pastExperience.some(exp => exp.toYear))
      filledCount += 1 / 7

    if (formData.pastExperience.some(exp => exp.lastCtc))
      filledCount += 1 / 7

    if (formData.pastExperience.some(exp => exp.designation))
      filledCount += 1 / 7

    if (formData.pastExperience.some(exp => exp.referenceContact))
      filledCount += 1 / 7

    if (formData.pastExperience.some(exp => exp.referenceName))
      filledCount += 1 / 7

    return Math.round(
      (filledCount / (tabContent.length - 1)) * 100
    )
  }

  useEffect(() => {
    if (calculateFilledTabs()) {
      setCalculateFilledTabsCount(calculateFilledTabs())
    }
  }, [calculateFilledTabs()])

  if (logedUser.id === profileId || Number(logedUser.role) === 1) {
    return (
      <>
        <form onSubmit={handleSubmit}>
          {loading && (
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.7)', // Optional background to dim the screen
                zIndex: 9999 // To make sure it's on top of other components
              }}
            >
              <Loader />
            </Box>
          )}
          <Dialog open={open} onClose={handleClose} maxWidth={false}>
            <DialogContent sx={{ position: 'relative' }}>
              <IconButton
                onClick={handleClose}
                sx={{ position: 'absolute', top: '10px', right: '10px', color: '#fff' }}
              >
                <Close color='primary' />
              </IconButton>
              {selectedImage.src && <RenderImage imageSrc={selectedImage.src} imageAlt={selectedImage.alt} />}
            </DialogContent>
          </Dialog>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700
              }}
            >
              Employee Profile
            </Typography>
            {(logedUser.role === '1') && (
              <Button
                variant="contained"
                color="success"
                onClick={downloadExcel}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3
                }}
              >
                Download Employee details
              </Button>
            )}
          </Box>
          <StyledTabs value={tabValue} onChange={handleTabChange} variant='scrollable' scrollButtons='auto'>
            {tabContent.map((tab, index) => (
              <StyledTab key={index} label={tab.label} />
            ))}
          </StyledTabs>

          <Box sx={{ p: 3 }}>{tabContent[tabValue].content}</Box>
        </form>

        <Divider />
        {Number(logedUser.role) < 3 && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              onClick={() => handleVerifyProfile(true)}
              disabled={!updating || formData.verify}
              variant='contained'
              sx={{ margin: '10px' }}
            >
              {formData.verify ? 'Profile Verified' : 'Verify Profile'}
            </Button>
            {formData.verify && (
              <Button
                onClick={() => handleVerifyProfile(false)}
                disabled={!formData.verify}
                variant='contained'
                color='error'
                sx={{ margin: '10px' }}
              >
                marked as unverified
              </Button>
            )}
          </Box>
        )}
        <ToastContainer />
      </>
    )
  } else {
    return null
  }
}

export default ProfileForm
