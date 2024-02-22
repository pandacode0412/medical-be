const { StatusCodes } = require("http-status-codes");
const { User } = require("../../models/User.model");
const { response } = require("../../utils/response");
const { securePassword } = require("../../utils/securePassword");
const { PASSWORD_DEFAULT } = require("../../../constants");

const createUser = async (req, res) => {
  const { username, email, phone, userType } = req.body;
  const password = PASSWORD_DEFAULT;
  if (!username || !email || !phone || !userType) {
    return response(
      res,
      StatusCodes.BAD_REQUEST,
      false,
      {},
      "Cung cấp đầy đủ thông tin"
    );
  }

  try {
    const oldUser = await User.findOne({
      username,
    });
    if (oldUser) {
      return response(
        res,
        StatusCodes.NOT_ACCEPTABLE,
        false,
        {},
        "username đã tồn tại"
      );
    }
    if (password.length < 6) {
      return response(
        res,
        StatusCodes.NOT_ACCEPTABLE,
        false,
        {},
        "Password must be minimum 6 charecter"
      );
    }

    const hashedPassword = await securePassword(password);

    const user = await User.create({
      email,
      password: hashedPassword,
      userType,
      activeStatus: true,
      username,
      phone,
    });

    if (!user) {
      return response(
        res,
        StatusCodes.FORBIDDEN,
        false,
        {},
        "Could not create user due to user error"
      );
    }

    return response(res, StatusCodes.ACCEPTED, true, { user: user }, null);
  } catch (error) {
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

const createPatient = async (req, res) => {
  const { fullName, birthday, phone, address, note } = req.body;
  const userType = "user";

  const password = PASSWORD_DEFAULT;
  if (!fullName || !birthday || !phone || !userType) {
    return response(
      res,
      StatusCodes.BAD_REQUEST,
      false,
      {},
      "Cung cấp đầy đủ thông tin"
    );
  }

  try {
    const oldUser = await User.findOne({
      phone,
    });
    if (oldUser) {
      return response(
        res,
        StatusCodes.NOT_ACCEPTABLE,
        false,
        {},
        "Số điện thoại đã tồn tại"
      );
    }
    if (password.length < 6) {
      return response(
        res,
        StatusCodes.NOT_ACCEPTABLE,
        false,
        {},
        "Password must be minimum 6 charecter"
      );
    }

    const hashedPassword = await securePassword(password);

    const user = await User.create({
      password: hashedPassword,
      userType,
      activeStatus: true,
      phone,
      birthday,
      fullName,
      address,
      note
    });

    if (!user) {
      return response(
        res,
        StatusCodes.FORBIDDEN,
        false,
        {},
        "Could not create user due to user error"
      );
    }

    return response(res, StatusCodes.ACCEPTED, true, { user: user }, null);
  } catch (error) {
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Get Users
const getUsers = async (req, res) => {
  const { skip, limit, activeStatus, userType, searchKey, sortBy } = req.body;

  try {
    const total = await User.countDocuments()
      .where(
        searchKey
          ? {
              $or: [
                {
                  fullName: { $regex: searchKey, $options: "i" },
                },
                {
                  email: { $regex: searchKey, $options: "i" },
                },
                {
                  phone: { $regex: searchKey, $options: "i" },
                },
              ],
            }
          : null
      )
      .where(activeStatus !== undefined ? { activeStatus: activeStatus } : null)
      .where(userType ? { userType: userType } : null);

    const users = await User.find().where(
        searchKey
          ? {
              $or: [
                {
                  fullName: { $regex: searchKey, $options: "i" },
                },
                {
                  email: { $regex: searchKey, $options: "i" },
                },
                {
                  phone: { $regex: searchKey, $options: "i" },
                },
              ],
            }
          : null
      )
      .where(activeStatus !== undefined ? { activeStatus: activeStatus } : null)
      .where(userType ? { userType: userType } : null)
      .sort(sortBy ? { [sortBy.field]: [sortBy.order] } : { createdAt: -1 })
      .limit(limit ? limit : null)
      .skip(skip ? skip : null);

    if (!users || users.length === 0) {
      return response(
        res,
        StatusCodes.NOT_FOUND,
        false,
        { total: 0, users: [] },
        "No users Found"
      );
    }

    return response(res, StatusCodes.OK, true, { total, users }, null);
  } catch (error) {
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Get User Details
const getUserDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id)
    if (!user) {
      return response(res, StatusCodes.NOT_FOUND, false, {}, "No user Found!");
    }

    return response(res, StatusCodes.OK, true, { user: user }, null);
  } catch (error) {
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Update User Dtails
const updateUserDetails = async (req, res) => {
  const { name, mobile, photo } = req.body;

  const id = req.params.id;

  let user = {};

  if (name) {
    user.name = name;
  }
  if (mobile) {
    user.mobile = mobile;
  }
  if (photo) {
    user.photo = photo;
  }

  if (user) {
    user.updatedAt = new Date();
    try {
      const newUser = await User.findByIdAndUpdate(id, user, {
        new: true,
      }).exec();
      if (!newUser) {
        return response(
          res,
          StatusCodes.BAD_REQUEST,
          false,
          {},
          "Could not update!"
        );
      }

      return response(res, StatusCodes.ACCEPTED, true, { user: newUser }, null);
    } catch (error) {
      return response(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        false,
        {},
        error.message
      );
    }
  } else {
    return response(
      res,
      StatusCodes.BAD_REQUEST,
      false,
      {},
      "Could not update!"
    );
  }
};

const updatePatient = async (req, res) => {
  const user = req.body;
  const id = req.params.id;

  if (user) {
    user.updatedAt = new Date();
    try {
      const newUser = await User.findByIdAndUpdate(id, user, {
        new: true,
      }).exec();
      if (!newUser) {
        return response(
          res,
          StatusCodes.BAD_REQUEST,
          false,
          {},
          "Could not update!"
        );
      }

      return response(res, StatusCodes.ACCEPTED, true, { user: newUser }, null);
    } catch (error) {
      return response(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        false,
        {},
        error.message
      );
    }
  } else {
    return response(
      res,
      StatusCodes.BAD_REQUEST,
      false,
      {},
      "Could not update!"
    );
  }
};

// Update Status
const updateStatus = async (req, res) => {
  const { activeStatus } = req.body;

  const id = req.params.id;

  let user = {};

  if (activeStatus !== undefined) {
    user.activeStatus = activeStatus;
  }

  if (user) {
    user.updatedAt = new Date();
    try {
      const newUser = await User.findByIdAndUpdate(id, user, {
        new: true,
      }).exec();
      if (!newUser) {
        return response(
          res,
          StatusCodes.BAD_REQUEST,
          false,
          {},
          "Could not update!"
        );
      }

      return response(res, StatusCodes.ACCEPTED, true, { user: newUser }, null);
    } catch (error) {
      return response(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        false,
        {},
        error.message
      );
    }
  } else {
    return response(
      res,
      StatusCodes.BAD_REQUEST,
      false,
      {},
      "Could not update!"
    );
  }
};

// Delete User
const deleteUser = async (req, res) => {
  const id = req.params.id;

  if (!id) {
    return response(res, StatusCodes.NOT_FOUND, false, {}, "No User Found!");
  }

  try {
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return response(
        res,
        StatusCodes.BAD_REQUEST,
        false,
        {},
        "Could not delete!"
      );
    }

    return response(res, StatusCodes.ACCEPTED, true, { user: user }, null);
  } catch (error) {
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

module.exports = {
  getUsers,
  getUserDetails,
  updateUserDetails,
  updateStatus,
  deleteUser,
  createUser,
  createPatient,
  updatePatient
};
