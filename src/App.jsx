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
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon
} from '@mui/icons-material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GoogleAuth from './components/GoogleAuth';

function App() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [extractedData, setExtractedData] = useState([]);
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
    setError(null);
    setExtractedData([]);
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

      // Try to get the response body text first, useful for both success and error
      const responseText = await response.text();
      let responseData = null;

      // If the response is OK, try to parse the text as JSON
      if (response.ok) {
        try {
          // Handle potentially empty successful responses
          responseData = responseText ? JSON.parse(responseText) : null;
        } catch (jsonError) {
          console.error('Failed to parse successful response JSON:', jsonError, 'Response Text:', responseText);
          // Decide how to handle: maybe throw error, maybe set empty data
          throw new Error('Received successful response, but failed to parse JSON body.');
        }
        
        // Process successful data
        if (responseData) {
            const transformedData = Object.entries(responseData).map(([key, value]) => ({
                key,
                value
            }));
            setExtractedData(transformedData);
        } else {
            // Handle empty successful response if needed
            console.warn("Received OK response but no JSON data.");
            setExtractedData([]);
        }

      } else if (response.status === 401) {
        // Token expired or invalid — clear it and prompt re-auth.
        localStorage.removeItem('DATA_EXTRACTOR_USER_TOKEN');
        setUser(null);
        throw new Error('Your session has expired. Please sign in again.');
      } else {
        // If response is not OK, try to parse the text as JSON for error details
        let errorDetails = null;
        try {
          errorDetails = responseText ? JSON.parse(responseText) : null;
        } catch (jsonError) {
          // JSON parsing failed, use the raw text as the error detail if available
          errorDetails = responseText || `Status code ${response.status} with no body`;
        }

        // Construct error message
        const errorMessage = errorDetails?.message // Try common 'message' field in JSON error
                            || errorDetails?.detail // Try common 'error' field in JSON error
                           || (typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails)) // Use text/stringified JSON
                           || `HTTP error! status: ${response.status}`; // Fallback
        throw new Error(errorMessage);
      }
      
    } catch (err) {
      // Log the raw error object for debugging
      console.error('Error processing document:', err);
      // Use the error message thrown, which should be more detailed now
      const displayError = err?.message || String(err) || 'An unknown error occurred.';
      setError(displayError);
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
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Extracted Content:
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {extractedData.map((item, index) => (
                    <ListItem
                      key={index}
                      divider
                      sx={{ py: 2 }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" component="span" sx={{ fontWeight: 'medium' }}>
                            {item.key}
                          </Typography>
                        }
                        secondary={JSON.stringify(item.value)}
                      />
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
