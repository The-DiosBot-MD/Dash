function decodeBuffer(value: string): ArrayBuffer {
    // @ts-expect-error this is fine.
    return Uint8Array.from(window.atob(value), c => c.charCodeAt(0));
}

function encodeBuffer(value: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(value)));
}

export { decodeBuffer, encodeBuffer };
