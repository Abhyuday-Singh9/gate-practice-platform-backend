function notImplemented(action) {
  return (_req, res) => {
    res.status(501).json({
      success: false,
      message: `${action} is not implemented yet`
    });
  };
}

module.exports = { notImplemented };
