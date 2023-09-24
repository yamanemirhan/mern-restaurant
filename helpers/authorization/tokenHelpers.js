const sendJwtToClient = (user, res) => {
  const token = user.generateJwtFromUser();
  const { JWT_COOKIE } = process.env;
  return res
    .status(200)
    .cookie("accessToken", token, {
      sameSite: "none",
      secure: true,
      httpOnly: true,
      expires: new Date(Date.now() + parseInt(JWT_COOKIE) * 1000),
    })
    .json({
      success: true,
      data: "restaurant",
      message: "Successfully login",
    });
};

const getAccessTokenFromHeader = (req) => {
  return req.headers["authorization"];
};
module.exports = {
  sendJwtToClient,
  getAccessTokenFromHeader,
};
