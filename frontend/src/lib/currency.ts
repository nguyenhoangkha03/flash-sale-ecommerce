export function formatVND(
    amount: number | string,
    showDecimals: boolean = false
): string {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;

    if (!Number.isFinite(num)) {
        return "0đ";
    }

    const formatted = num.toLocaleString("vi-VN", {
        minimumFractionDigits: showDecimals ? 2 : 0,
        maximumFractionDigits: showDecimals ? 2 : 0,
    });

    return `${formatted} đ`;
}

export function formatNumber(amount: number): string {
    if (!Number.isFinite(amount)) {
        return "0";
    }

    return amount.toLocaleString("vi-VN");
}

export function parseVND(vndString: string): number {
    if (!vndString) return 0;

    const cleaned = vndString.replace(/đ/g, "").replace(/\s/g, "").trim();

    const normalized = cleaned.replace(/,/g, ".");

    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}
