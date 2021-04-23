import { HexDirection } from '../enums/HexDirection.enum';

export class HexDirectionExtension {
	public static opposite (direction: HexDirection) {
    return direction < 3 ? (direction + 3) : (direction - 3);
	}

	public static mirrorAtXAxis (direction: HexDirection){
		switch(direction){
			case 5:
				return 3;
			case 0:
				return 2;
			case 2: 
				return 0;
			case 3:
				return 5;
			default:
				return direction;
		}
	}

    public static previous (direction: HexDirection) {
		return direction == HexDirection.NE ? HexDirection.NW : (direction - 1);
	}

	public static next (direction: HexDirection) {
		return direction == HexDirection.NW ? HexDirection.NE : (direction + 1);
	}
}