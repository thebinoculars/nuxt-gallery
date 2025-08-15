export const commonErrorResponse = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return {
      headers: { 'Content-Type': 'application/json' },
      statusCode: 401,
      body: JSON.stringify({
        success: false,
        message: 'Invalid token',
      }),
    }
  }

  return {
    headers: { 'Content-Type': 'application/json' },
    statusCode: 500,
    body: JSON.stringify({
      success: false,
      message: 'Server error',
    }),
  }
}
