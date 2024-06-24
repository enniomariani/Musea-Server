export const DataIndicator = {
    Text: 0,
    BinaryData: 1
} as const;
export type DataIndicator = typeof DataIndicator[keyof typeof DataIndicator];

export class ConvertNetworkData {
    static readonly INTERPRETATION_ERROR:string = "error, data could not be interpreted!";

    constructor() {}

    static encodeCommand(...segments: (string | Uint8Array)[]): Uint8Array {
        const encoder: TextEncoder = new TextEncoder();
        const numParts: number = segments.length;
        const headerLength: number = 1 + 5 * numParts; // 5 bytes per segment (dataType + offset) + one byte for saving how many segments there are

        let totalLength:number = headerLength;
        const segmentTypes: number[] = [];

        segments.forEach(segment => {
            let length: number;
            if (typeof segment === 'string') {
                const encodedPart = encoder.encode(segment);
                segmentTypes.push(DataIndicator.Text);
                length = encodedPart.length;
            } else if (segment instanceof Uint8Array) {
                segmentTypes.push(DataIndicator.BinaryData);
                length = segment.length;
            } else {
                console.error("ConvertNetworkData: unknown data format: ", segment);
                return; // Skip invalid segments
            }
            totalLength += length;
        });

        // Create the final buffer
        const result:Uint8Array = new Uint8Array(totalLength);
        const header:DataView = new DataView(result.buffer, 0, headerLength);

        // Set the number of segments in the first byte of the header
        header.setUint8(0, numParts);

        let offset:number = headerLength;

        // Second pass: set segment offsets in the header and copy data directly into result buffer
        segments.forEach((segment, index) => {
            header.setUint8(1 + index * 5, segmentTypes[index]); // Set segment type
            header.setUint32(2 + index * 5, offset, true);    // Set segment offset

            if (typeof segment === 'string') {
                const encodedPart:Uint8Array = encoder.encode(segment);
                result.set(encodedPart, offset); // Directly set the encoded segment in result buffer
                offset += encodedPart.length;
            } else if (segment instanceof Uint8Array) {
                result.set(segment, offset); // Directly copy Uint8Array into result buffer
                offset += segment.length;
            }
        });

        return result;
    }

    /**
     * Decode the passed data into an array of strings and Uint8Arrays.
     *
     * Return INTERPRETATION_ERROR as  the first element of the array if the data is not valid
     *
     * @param {Uint8Array} data
     * @returns {(string | Uint8Array)[]}
     */
    static decodeCommand(data: Uint8Array): (string | Uint8Array)[] {
        const segments: (string | Uint8Array)[] = [];
        const decoder = new TextDecoder();

        if (data.length <= 0)
            return [ConvertNetworkData.INTERPRETATION_ERROR];

        const numSegments:number = data[0];  // Read the first byte for the number of segments

        if (numSegments <= 0)
            return [ConvertNetworkData.INTERPRETATION_ERROR];

        // Calculate header length (1 byte for numParts, 5 bytes per segment)
        const headerLength = 1 + numSegments * 5;

        if (data.length < headerLength)
            return [ConvertNetworkData.INTERPRETATION_ERROR]; // Handle invalid data

        const header = new DataView(data.buffer, data.byteOffset + 1, numSegments * 5); // Extract the header view

        // Process each segment
        for (let i = 0; i < numSegments; i++) {
            const segmentType = header.getUint8(i * 5); // Get the type of the part
            const startOffset = header.getUint32(i * 5 + 1, true); // Get the offset

            const endOffset = (i + 1 < numSegments)
                ? header.getUint32((i + 1) * 5 + 1, true)  // Get next offset if not the last segment
                : data.length;  // If it's the last part, use the full data length

            const segmentData = data.subarray(startOffset, endOffset);  // Use subarray to avoid memory copy

            if (segmentData.length <= 0) {
                return [ConvertNetworkData.INTERPRETATION_ERROR];  // Handle invalid part
            }

            // Handle text or binary data based on the segment type
            if (segmentType === DataIndicator.Text) {
                segments.push(decoder.decode(segmentData));  // Decode text directly
            } else if (segmentType === DataIndicator.BinaryData) {
                segments.push(segmentData);  // Push the binary data directly (no extra copy)
            } else {
                return [ConvertNetworkData.INTERPRETATION_ERROR];  // Handle unknown data type
            }
        }

        return segments;
    }
}