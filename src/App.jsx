import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Paper, 
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  IconButton,
  ListItemSecondaryAction,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Fab,
  useMediaQuery
} from '@mui/material';
import { 
  Upload as UploadIcon,
  Description as DocumentIcon,
  Login as LoginIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  CheckCircle as CheckIcon,
  Cancel as XIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon
} from '@mui/icons-material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GoogleAuth from './components/GoogleAuth';

function App() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [extractedData, setExtractedData] = useState([]);
  const [validatedData, setValidatedData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(localStorage.getItem('DATA_EXTRACTOR_USER_TOKEN'));
  const [mode, setMode] = useState('dark');
  
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  useEffect(() => {
    setMode(prefersDarkMode ? 'dark' : 'light');
  }, [prefersDarkMode]);

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'dark' ? '#90caf9' : '#1976d2',
          },
          background: {
            default: mode === 'dark' ? '#121212' : '#f5f5f5',
            paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
          },
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
              },
            },
          },
        },
      }),
    [mode]
  );

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    // Cleanup object URL when file changes
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setError(null);
    console.log('User logged in:', userData);
  };

  const handleAuthError = (error) => {
    setError('Authentication failed. Please try again.');
    console.error('Auth error:', error);
  };

  const handleLogout = () => {
    localStorage.removeItem('DATA_EXTRACTOR_USER_TOKEN');
    setUser(null);
  };

  const handleFileUpload = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile || !selectedFile.type.includes('pdf') && !selectedFile.type.includes('png')) {
      setError('Please upload a PDF or PNG file');
      setFile(null);
      setFileUrl(null);
      return;
    }

    setFile(selectedFile);
    setFileUrl(URL.createObjectURL(selectedFile));
    handleProcessDocument(selectedFile);
  };

  const handleProcessDocument = async (selectedFile) => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    if (!user) {
      setError('Please sign in first');
      return;
    }

    const IS_LOCALHOST = window.location.hostname.includes("localhost");
    const API_URL = IS_LOCALHOST ? 'http://localhost:9000/' : 'https://api.simplejay.com/';

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API_URL}data/ocr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const transformedData = Object.entries(data).map(([key, value]) => ({
        key,
        value,
        validation: 'unvalidated'
      }));

      setExtractedData(transformedData);
      setValidatedData({});
      
    } catch (err) {
      console.error('Error processing document:', err);
      setError('Error processing document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <Container maxWidth="md" sx={{ py: 4, minHeight: '100vh' }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DocumentIcon fontSize="large" />
                Data Extractor
              </Typography>
              <Box>
                {!user ? (
                  <GoogleAuth onSuccess={handleAuthSuccess} onError={handleAuthError} />
                ) : (
                  <Button
                    variant="outlined"
                    onClick={handleLogout}
                    startIcon={<LoginIcon />}
                  >
                    Logout
                  </Button>
                )}
              </Box>
            </Box>
            
            <Card variant="outlined" sx={{ my: 3 }}>
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  gap: 2 
                }}>
                  {!file && (
                    <Button
                      variant="contained"
                      component="label"
                      disabled={loading || !user}
                      startIcon={<UploadIcon />}
                      size="large"
                    >
                      Select File
                      <input
                        type="file"
                        hidden
                        accept=".pdf,.png"
                        onChange={handleFileUpload}
                      />
                    </Button>
                  )}

                  {!user && (
                    <Typography variant="body2" color="text.secondary">
                      Please sign in to upload and process documents
                    </Typography>
                  )}

                  {file && (
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 2 
                      }}>
                        <Typography variant="body1" color="text.secondary">
                          {file.name}
                        </Typography>
                        <Button
                          variant="outlined"
                          component="label"
                          size="small"
                          startIcon={<UploadIcon />}
                        >
                          Change File
                          <input
                            type="file"
                            hidden
                            accept=".pdf,.png"
                            onChange={handleFileUpload}
                          />
                        </Button>
                      </Box>
                      <Box sx={{ 
                        width: '100%',
                        height: file.type.includes('pdf') ? '400px' : 'auto',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}>
                        {file.type.includes('pdf') ? (
                          <iframe
                            src={fileUrl}
                            style={{
                              width: '100%',
                              height: '100%',
                              border: 'none'
                            }}
                            title="PDF Preview"
                          />
                        ) : (
                          <img
                            src={fileUrl}
                            alt="Document Preview"
                            style={{
                              width: '100%',
                              objectFit: 'contain'
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ my: 2 }}>
                {error}
              </Alert>
            )}

            {extractedData.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Extracted Content:
                  </Typography>
                  <Button
                    variant="contained"
                    disabled={true}
                    startIcon={<SaveIcon />}
                    onClick={() => {
                      const validItems = extractedData
                        .filter(item => item.validation === 'valid')
                        .reduce((acc, item) => ({
                          ...acc,
                          [item.key]: item.value
                        }), {});
                      console.log('Submitting validated data:', validItems);
                      // TODO: Add API call to submit validated data
                    }}
                  >
                    Submit Data
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {extractedData.map((item, index) => (
                    <ListItem 
                      key={index}
                      divider
                      sx={{
                        bgcolor: item.validation === 'valid' ? 'rgba(76, 175, 80, 0.08)' : 
                               item.validation === 'invalid' ? 'rgba(244, 67, 54, 0.08)' : 
                               'inherit',
                        transition: 'background-color 0.2s',
                        py: 2
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" component="span" sx={{ fontWeight: 'medium' }}>
                            {item.key}
                          </Typography>
                        }
                        secondary={item.value}
                        sx={{ mr: 2 }}
                      />
                      <ListItemSecondaryAction sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          onClick={() => {
                            const newData = [...extractedData];
                            newData[index] = {
                              ...newData[index],
                              validation: item.validation === 'valid' ? 'unvalidated' : 'valid'
                            };
                            setExtractedData(newData);
                          }}
                          sx={{
                            color: item.validation === 'valid' ? 'success.main' : 'action.disabled',
                            '&:hover': {
                              color: 'success.main',
                              bgcolor: 'success.lighter'
                            },
                            padding: 1.5
                          }}
                        >
                          <CheckIcon sx={{ fontSize: 28 }} />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            const newData = [...extractedData];
                            newData[index] = {
                              ...newData[index],
                              validation: item.validation === 'invalid' ? 'unvalidated' : 'invalid'
                            };
                            setExtractedData(newData);
                          }}
                          sx={{
                            color: item.validation === 'invalid' ? 'error.main' : 'action.disabled',
                            '&:hover': {
                              color: 'error.main',
                              bgcolor: 'error.lighter'
                            },
                            padding: 1.5
                          }}
                        >
                          <XIcon sx={{ fontSize: 28 }} />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Paper>

          <Fab
            color="primary"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000
            }}
            onClick={toggleTheme}
            aria-label="toggle theme"
          >
            {mode === 'dark' ? <LightIcon /> : <DarkIcon />}
          </Fab>
        </Container>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}

export default App;
