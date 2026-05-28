import {
  compareHash,
  generateDecryption,
  generateEncryption,
  generateHash,
} from "../utils/security";

export class SecurityServices {
  constructor() {}
  generateHash = generateHash;
  compareHash = compareHash;

  generateEncryption = generateEncryption;
  generateDecryption = generateDecryption;
}
