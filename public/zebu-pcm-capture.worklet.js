class ZebuPcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetRate = 16000;
    this.carry = [];
  }
  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input?.length) return true;
    const ratio = sampleRate / this.targetRate;
    const size = Math.floor(input.length / ratio);
    if (!size) return true;
    const pcm = new Int16Array(size);
    for (let index = 0; index < size; index += 1) {
      const start = Math.floor(index * ratio);
      const end = Math.min(input.length, Math.floor((index + 1) * ratio));
      let sum = 0;
      for (let cursor = start; cursor < end; cursor += 1) sum += input[cursor];
      const value = Math.max(-1, Math.min(1, sum / Math.max(1, end - start)));
      pcm[index] = value < 0 ? value * 0x8000 : value * 0x7fff;
    }
    this.port.postMessage(pcm.buffer, [pcm.buffer]);
    return true;
  }
}
registerProcessor("zebu-pcm-capture", ZebuPcmCaptureProcessor);
