const User = require('../models/User');
const ParkingSlot = require('../models/ParkingSlot');
const { normalizeVehicleNumber, serializeUser } = require('../utils/parking');

function createVehicleController() {
  async function listMyVehicles(req, res) {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const serializedUser = serializeUser(user);

    return res.json({
      vehicles: serializedUser.vehicles,
      defaultVehicleNo: serializedUser.defaultVehicleNo,
    });
  }

  async function addVehicle(req, res) {
    const { number, type = 'Car', model = '', color = '', makeDefault = false } = req.body;
    const normalizedNumber = normalizeVehicleNumber(number);

    if (!normalizedNumber) {
      return res.status(400).json({ message: 'Vehicle number is required' });
    }

    if (!['Car', 'Bike', 'EV'].includes(type)) {
      return res.status(400).json({ message: 'Invalid vehicle type' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const alreadyOwned = (user.vehicles || []).some((vehicle) => normalizeVehicleNumber(vehicle.number) === normalizedNumber);
    if (alreadyOwned) {
      return res.status(409).json({ message: 'This vehicle is already in your profile' });
    }

    const otherOwner = await User.findOne({
      _id: { $ne: user._id },
      $or: [
        { vehicleNo: normalizedNumber },
        { defaultVehicleNo: normalizedNumber },
        { vehicles: { $elemMatch: { number: normalizedNumber } } },
      ],
    });

    if (otherOwner) {
      return res.status(409).json({ message: 'This vehicle number is already registered to another user' });
    }

    const shouldBeDefault = Boolean(makeDefault) || !user.vehicles?.length || !user.defaultVehicleNo;
    const nextVehicles = [...(user.vehicles || []).map((vehicle) => {
      const baseVehicle = typeof vehicle.toObject === 'function' ? vehicle.toObject() : vehicle;
      return { ...baseVehicle, isDefault: false };
    })];
    nextVehicles.push({
      number: normalizedNumber,
      type,
      model,
      color,
      isDefault: shouldBeDefault,
    });

    user.vehicles = nextVehicles;
    if (shouldBeDefault) {
      user.defaultVehicleNo = normalizedNumber;
      user.vehicleNo = normalizedNumber;
    } else if (!user.defaultVehicleNo && nextVehicles.length) {
      user.defaultVehicleNo = nextVehicles[0].number;
      user.vehicleNo = nextVehicles[0].number;
      user.vehicles[0].isDefault = true;
    }

    await user.save();
    return res.status(201).json({ message: 'Vehicle added', user: serializeUser(user) });
  }

  async function setDefaultVehicle(req, res) {
    const { number } = req.body;
    const normalizedNumber = normalizeVehicleNumber(number);

    if (!normalizedNumber) {
      return res.status(400).json({ message: 'Vehicle number is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const match = (user.vehicles || []).find((vehicle) => normalizeVehicleNumber(vehicle.number) === normalizedNumber);
    if (!match) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    user.vehicles = (user.vehicles || []).map((vehicle) => {
      const baseVehicle = typeof vehicle.toObject === 'function' ? vehicle.toObject() : vehicle;
      return {
        ...baseVehicle,
        isDefault: normalizeVehicleNumber(vehicle.number) === normalizedNumber,
      };
    });
    user.defaultVehicleNo = normalizedNumber;
    user.vehicleNo = normalizedNumber;

    await user.save();
    return res.json({ message: 'Default vehicle updated', user: serializeUser(user) });
  }

  async function removeVehicle(req, res) {
    const normalizedNumber = normalizeVehicleNumber(req.params.number);

    if (!normalizedNumber) {
      return res.status(400).json({ message: 'Vehicle number is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const activeSlot = await ParkingSlot.findOne({ carNumber: normalizedNumber });
    if (activeSlot) {
      return res.status(409).json({ message: 'Release the active parking slot before removing this vehicle' });
    }

    const remainingVehicles = (user.vehicles || []).filter((vehicle) => normalizeVehicleNumber(vehicle.number) !== normalizedNumber);
    if (remainingVehicles.length === (user.vehicles || []).length) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    user.vehicles = remainingVehicles.map((vehicle, index) => {
      const baseVehicle = typeof vehicle.toObject === 'function' ? vehicle.toObject() : vehicle;
      return {
        ...baseVehicle,
        isDefault: index === 0,
      };
    });

    const nextDefault = user.vehicles[0]?.number || null;
    user.defaultVehicleNo = nextDefault;
    user.vehicleNo = nextDefault;

    await user.save();
    return res.json({ message: 'Vehicle removed', user: serializeUser(user) });
  }

  return {
    listMyVehicles,
    addVehicle,
    setDefaultVehicle,
    removeVehicle,
  };
}

module.exports = {
  createVehicleController,
};