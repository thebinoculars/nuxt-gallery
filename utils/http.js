export const commonErrorResponse = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return {
      statusCode: 401,
      body: JSON.stringify({
        success: false,
        message: 'Invalid token',
      }),
    }
  }

  return {
    statusCode: 500,
    body: JSON.stringify({
      success: false,
      message: 'Server error',
    }),
  }
}
