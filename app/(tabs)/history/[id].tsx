import { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { HistoryService, muscleColor, SessionPoint } from "@/lib/services/HistoryService";

// ─── Layout constants ─────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get("window");
const H_PAD = 20;
const GRAPH_W = SCREEN_W - H_PAD * 2;
const GRAPH_H = 220;
const TOOLTIP_W = 130;
const TOOLTIP_H = 62;

// ─── Line graph ───────────────────────────────────────────────────────────────

function StrengthChart({
                           points,
                           prWeight,
                       }: {
    points: SessionPoint[];
    prWeight: number;
}) {
    const [activeIdx, setActiveIdx] = useState<number | null>(null);

    if (points.length === 0) {
        return (
            <View style={chart.empty}>
                <Text style={chart.emptyText}>No weight data recorded yet.</Text>
            </View>
        );
    }

    const weights = points.map((p) => p.avg_weight);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const range = maxW - minW || 1;

    // Layout: left pad for y-labels, right/vertical pads for breathing room
    const PAD_L = 42;
    const PAD_R = 12;
    const PAD_T = 20;
    const PAD_B = 28; // room for x-axis date labels
    const plotW = GRAPH_W - PAD_L - PAD_R;
    const plotH = GRAPH_H - PAD_T - PAD_B;

    const toX = (i: number) =>
        PAD_L + (i / Math.max(points.length - 1, 1)) * plotW;
    const toY = (w: number) =>
        PAD_T + plotH - ((w - minW) / range) * plotH;

    const circles = points.map((p, i) => ({ x: toX(i), y: toY(p.avg_weight), point: p }));

    // Tooltip clamped to graph bounds
    const activePt = activeIdx !== null ? circles[activeIdx] : null;
    const tooltipLeft = activePt
        ? Math.min(Math.max(activePt.x - TOOLTIP_W / 2, 0), GRAPH_W - TOOLTIP_W)
        : 0;
    const tooltipTop = activePt
        ? activePt.y - TOOLTIP_H - 14 < 0
            ? activePt.y + 16
            : activePt.y - TOOLTIP_H - 14
        : 0;

    // Y-axis guide values: min, mid, max
    const yGuides = [maxW, (minW + maxW) / 2, minW];

    const dateLabel = (iso: string, short = false) => {
        const d = new Date(iso);
        return short
            ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
    };

    return (
        <View style={{ width: GRAPH_W, height: GRAPH_H }}>
            {/* Y-axis guides + labels */}
            {yGuides.map((val, idx) => {
                const t = idx / (yGuides.length - 1);
                const y = PAD_T + t * plotH;
                return (
                    <View key={idx}>
                        <View style={[chart.guideLine, { top: y }]} />
                        <Text style={[chart.yLabel, { top: y - 7 }]}>
                            {val.toFixed(1)}
                        </Text>
                    </View>
                );
            })}

            {/* PR dashed line (if PR > maxW shown, skip; else draw it) */}
            {prWeight > 0 && prWeight >= minW && prWeight <= maxW && (
                <View
                    style={[
                        chart.prLine,
                        { top: toY(prWeight) },
                    ]}
                />
            )}

            {/* Connecting lines */}
            {circles.slice(0, -1).map((c, i) => {
                const next = circles[i + 1];
                const dx = next.x - c.x;
                const dy = next.y - c.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
                const isActive = activeIdx !== null && (i === activeIdx || i + 1 === activeIdx);
                return (
                    <View
                        key={i}
                        style={{
                            position: "absolute",
                            left: c.x,
                            top: c.y - 1.5,
                            width: len,
                            height: 3,
                            backgroundColor: "#3B82F6",
                            opacity: isActive ? 1 : 0.4,
                            transformOrigin: "left center",
                            transform: [{ rotate: `${angle}deg` }],
                        }}
                    />
                );
            })}

            {/* Dots */}
            {circles.map((c, i) => {
                const isActive = activeIdx === i;
                return (
                    <TouchableOpacity
                        key={i}
                        onPress={() => setActiveIdx(isActive ? null : i)}
                        activeOpacity={0.8}
                        style={{
                            position: "absolute",
                            left: c.x - 14,
                            top: c.y - 14,
                            width: 28,
                            height: 28,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <View style={[chart.dot, isActive && chart.dotActive]} />
                    </TouchableOpacity>
                );
            })}

            {/* X-axis date labels: first and last only (avoids overlap) */}
            {points.length > 0 && (
                <>
                    <Text
                        style={[chart.xLabel, { left: PAD_L, bottom: 4 }]}
                        numberOfLines={1}
                    >
                        {dateLabel(points[0].started_at, true)}
                    </Text>
                    {points.length > 1 && (
                        <Text
                            style={[chart.xLabel, { right: PAD_R, bottom: 4, textAlign: "right" }]}
                            numberOfLines={1}
                        >
                            {dateLabel(points[points.length - 1].started_at, true)}
                        </Text>
                    )}
                </>
            )}

            {/* Tooltip */}
            {activePt && (
                <View style={[chart.tooltip, { left: tooltipLeft, top: tooltipTop, width: TOOLTIP_W }]}>
                    <Text style={chart.tooltipDate}>{dateLabel(activePt.point.started_at)}</Text>
                    <Text style={chart.tooltipWeight}>{activePt.point.avg_weight} kg avg</Text>
                    <Text style={chart.tooltipReps}>
                        {activePt.point.avg_reps > 0 ? `${activePt.point.avg_reps} reps avg` : `${activePt.point.set_count} sets`}
                    </Text>
                </View>
            )}
        </View>
    );
}

const chart = StyleSheet.create({
    guideLine: {
        position: "absolute",
        left: 0,
        right: 0,
        height: StyleSheet.hairlineWidth,
        backgroundColor: "#E5E7EB",
    },
    prLine: {
        position: "absolute",
        left: 0,
        right: 0,
        height: 1.5,
        backgroundColor: "#F59E0B",
        opacity: 0.6,
        // RN doesn't support borderStyle dashed on View well on Android,
        // so we use opacity + colour to distinguish it
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#3B82F6",
        borderWidth: 2,
        borderColor: "#fff",
        shadowColor: "#3B82F6",
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 3,
    },
    dotActive: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: "#2563EB",
        borderWidth: 2.5,
        shadowOpacity: 0.7,
        shadowRadius: 6,
        elevation: 5,
    },
    yLabel: {
        position: "absolute",
        left: 0,
        width: 38,
        textAlign: "right",
        fontSize: 9,
        color: "#9CA3AF",
        fontVariant: ["tabular-nums"],
    },
    xLabel: {
        position: "absolute",
        fontSize: 9,
        color: "#9CA3AF",
        width: 60,
    },
    tooltip: {
        position: "absolute",
        backgroundColor: "#1F2937",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 10,
        alignItems: "center",
    },
    tooltipDate:   { fontSize: 10, color: "#9CA3AF", marginBottom: 1 },
    tooltipWeight: { fontSize: 16, fontWeight: "800", color: "#F9FAFB", letterSpacing: -0.4 },
    tooltipReps:   { fontSize: 11, color: "#60A5FA", marginTop: 2 },
    empty: {
        width: GRAPH_W,
        height: GRAPH_H,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: { fontSize: 14, color: "#9CA3AF" },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ExerciseChartScreen() {
    const router = useRouter();
    const { user } = useAuth();

    // Params passed from History grid — no extra fetch needed for summary data
    const params = useLocalSearchParams<{
        id: string;
        name: string;
        primary_muscle: string;
        times_completed: string;
        pr_weight: string;
    }>();

    const prWeight = parseFloat(params.pr_weight ?? "0");
    const timesCompleted = parseInt(params.times_completed ?? "0", 10);
    const mc = muscleColor(params.primary_muscle ?? "");

    const [points, setPoints] = useState<SessionPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id || !params.id) return;
        setLoading(true);
        HistoryService.getSessionPoints(user.id, params.id)
            .then(setPoints)
            .catch((e) => setError(e.message ?? "Failed to load data"))
            .finally(() => setLoading(false));
    }, [user?.id, params.id]);

    const latestWeight = points.length > 0 ? points[points.length - 1].avg_weight : null;
    const improvement =
        points.length > 1
            ? +(points[points.length - 1].avg_weight - points[0].avg_weight).toFixed(1)
            : null;

    return (
        <SafeAreaView style={s.screen}>
            <StatusBar barStyle="dark-content" />

            {/* Nav bar */}
            <View style={s.navbar}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
                    <Text style={s.backArrow}>‹</Text>
                    <Text style={s.backLabel}>History</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

                {/* Exercise header */}
                <View style={s.exerciseHeader}>
                    <View style={[s.muscleTag, { backgroundColor: mc.bg }]}>
                        <Text style={[s.muscleTagText, { color: mc.text }]}>
                            {params.primary_muscle}
                        </Text>
                    </View>
                    <Text style={s.exerciseName}>{params.name}</Text>
                </View>

                {/* Summary stats */}
                <View style={s.statsRow}>
                    <View style={s.statBox}>
                        <Text style={s.statNum}>{timesCompleted}</Text>
                        <Text style={s.statLabel}>Sessions</Text>
                    </View>
                    <View style={s.statBox}>
                        <Text style={[s.statNum, { color: "#3B82F6" }]}>
                            {prWeight > 0 ? `${prWeight} kg` : "—"}
                        </Text>
                        <Text style={s.statLabel}>PR (best set)</Text>
                    </View>
                    <View style={s.statBox}>
                        <Text style={[s.statNum, improvement != null && improvement >= 0 ? { color: "#10B981" } : { color: "#EF4444" }]}>
                            {improvement != null
                                ? `${improvement >= 0 ? "+" : ""}${improvement} kg`
                                : "—"}
                        </Text>
                        <Text style={s.statLabel}>Progress</Text>
                    </View>
                </View>

                {/* Chart section */}
                <Text style={s.sectionTitle}>Avg weight per session</Text>
                <View style={s.chartCard}>
                    {loading ? (
                        <ActivityIndicator color="#3B82F6" style={{ height: GRAPH_H }} />
                    ) : error ? (
                        <View style={{ height: GRAPH_H, alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ color: "#EF4444", fontSize: 13 }}>{error}</Text>
                        </View>
                    ) : (
                        <StrengthChart points={points} prWeight={prWeight} />
                    )}
                    <Text style={s.chartHint}>Tap a dot to see session details</Text>
                </View>

                {/* Session log */}
                {!loading && points.length > 0 && (
                    <>
                        <Text style={s.sectionTitle}>Session log</Text>
                        <View style={s.logCard}>
                            {[...points].reverse().map((p, i) => {
                                const d = new Date(p.started_at);
                                const label = d.toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                });
                                return (
                                    <View
                                        key={p.session_id}
                                        style={[
                                            s.logRow,
                                            i < points.length - 1 && s.logRowBorder,
                                        ]}
                                    >
                                        <Text style={s.logDate}>{label}</Text>
                                        <Text style={s.logReps}>
                                            {p.avg_reps > 0 ? `${p.avg_reps} reps avg` : `${p.set_count} sets`}
                                        </Text>
                                        <Text style={s.logWeight}>{p.avg_weight} kg</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#F9FAFB" },

    // Nav
    navbar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#E5E7EB",
        backgroundColor: "#F9FAFB",
    },
    backBtn: { flexDirection: "row", alignItems: "center", padding: 4 },
    backArrow: { fontSize: 28, color: "#3B82F6", lineHeight: 30, marginRight: 2 },
    backLabel: { fontSize: 16, color: "#3B82F6", fontWeight: "500" },

    body: { padding: H_PAD, paddingBottom: 48, gap: 0 },

    // Exercise header
    exerciseHeader: { marginBottom: 20 },
    muscleTag: {
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginBottom: 8,
    },
    muscleTagText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize", letterSpacing: 0.3 },
    exerciseName: { fontSize: 26, fontWeight: "800", color: "#111827", letterSpacing: -0.5 },

    // Stats
    statsRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 24,
    },
    statBox: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 14,
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    statNum: { fontSize: 18, fontWeight: "800", color: "#111827", letterSpacing: -0.3 },
    statLabel: {
        fontSize: 9,
        color: "#9CA3AF",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginTop: 3,
        textAlign: "center",
    },

    // Chart
    sectionTitle: {
        fontSize: 12,
        fontWeight: "700",
        color: "#6B7280",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 10,
    },
    chartCard: {
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 14,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    chartHint: {
        fontSize: 10,
        color: "#D1D5DB",
        textAlign: "center",
        marginTop: 8,
    },

    // Log
    logCard: {
        backgroundColor: "#fff",
        borderRadius: 18,
        paddingHorizontal: 16,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    logRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 13,
    },
    logRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#F3F4F6",
    },
    logDate:   { flex: 1, fontSize: 13, color: "#374151", fontWeight: "500" },
    logReps:   { fontSize: 12, color: "#9CA3AF", marginRight: 12 },
    logWeight: { fontSize: 14, fontWeight: "700", color: "#111827", width: 56, textAlign: "right" },
});