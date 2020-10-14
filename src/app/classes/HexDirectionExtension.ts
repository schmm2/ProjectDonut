import { HexDirection } from '../enums/HexDirection.enum';

export class HexDirectionExtension {
	public static opposite (direction: HexDirection) {
        //let directionNumber = HexDirection[direction];
		return direction < 3 ? (direction + 3) : (direction - 3);
	}

    public static previous (direction: HexDirection) {
		return direction == HexDirection.NE ? HexDirection.NW : (direction - 1);
	}

	public static next (direction: HexDirection) {
		return direction == HexDirection.NW ? HexDirection.NE : (direction + 1);
	}
}