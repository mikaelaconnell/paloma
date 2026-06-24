import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, borderRadius } from "../lib/theme";
import {
  isConnected,
  getPinterestAuthUrl,
  getMyBoards,
  getBoardPins,
  searchMyPins,
  getPinImageUrl,
  disconnect,
  PinterestBoard,
  PinterestPin,
} from "../lib/pinterest";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - spacing.md * 3) / 2;

interface Props {
  onSelectPin: (pin: { imageUrl: string; title: string | null; description: string | null; sourceUrl: string }) => void;
  onClose: () => void;
}

type Mode = "boards" | "board-pins" | "search";

export default function PinterestBrowser({ onSelectPin, onClose }: Props) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("boards");

  // Boards
  const [boards, setBoards] = useState<PinterestBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<PinterestBoard | null>(null);

  // Pins
  const [pins, setPins] = useState<PinterestPin[]>([]);
  const [bookmark, setBookmark] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const conn = await isConnected();
    setConnected(conn);
    if (conn) {
      await loadBoards();
    }
    setLoading(false);
  };

  const handleConnect = async () => {
    const url = getPinterestAuthUrl();
    await Linking.openURL(url);
    // The OAuth callback will be handled by deep linking
    // For now, show instructions
    Alert.alert(
      "Connect Pinterest",
      "After authorizing, you'll be redirected back to Paloma. If the redirect doesn't work, come back here and try again.",
      [{ text: "OK" }]
    );
  };

  const handleDisconnect = async () => {
    Alert.alert("Disconnect Pinterest?", "You can reconnect anytime.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disconnect",
        style: "destructive",
        onPress: async () => {
          await disconnect();
          setConnected(false);
          setBoards([]);
          setPins([]);
        },
      },
    ]);
  };

  const loadBoards = async () => {
    setLoading(true);
    const result = await getMyBoards();
    setBoards(result);
    setLoading(false);
  };

  const loadBoardPins = async (board: PinterestBoard) => {
    setSelectedBoard(board);
    setMode("board-pins");
    setLoading(true);
    const result = await getBoardPins(board.id);
    setPins(result.items);
    setBookmark(result.bookmark);
    setLoading(false);
  };

  const loadMorePins = async () => {
    if (!bookmark || loadingMore) return;
    setLoadingMore(true);

    let result;
    if (mode === "board-pins" && selectedBoard) {
      result = await getBoardPins(selectedBoard.id, bookmark);
    } else if (mode === "search") {
      result = await searchMyPins(searchQuery, bookmark);
    }

    if (result) {
      setPins((prev) => [...prev, ...result.items]);
      setBookmark(result.bookmark);
    }
    setLoadingMore(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setMode("search");
    setLoading(true);
    const result = await searchMyPins(searchQuery.trim());
    setPins(result.items);
    setBookmark(result.bookmark);
    setLoading(false);
  };

  const handleSelectPin = (pin: PinterestPin) => {
    const imageUrl = getPinImageUrl(pin);
    if (!imageUrl) {
      Alert.alert("No image", "This pin doesn't have an image we can use.");
      return;
    }

    onSelectPin({
      imageUrl,
      title: pin.title,
      description: pin.description,
      sourceUrl: pin.link || `https://www.pinterest.com/pin/${pin.id}/`,
    });
  };

  // Not connected state
  if (!connected && !loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pinterest</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.connectState}>
          <View style={styles.pinterestLogo}>
            <Ionicons name="logo-pinterest" size={48} color="#E60023" />
          </View>
          <Text style={styles.connectTitle}>Connect Pinterest</Text>
          <Text style={styles.connectSubtitle}>
            Browse your boards and pins to find inspo for your trip. Import
            entire boards to your mood board.
          </Text>
          <TouchableOpacity style={styles.connectBtn} onPress={handleConnect}>
            <Ionicons name="logo-pinterest" size={20} color={colors.white} />
            <Text style={styles.connectBtnText}>Connect Pinterest</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Split pins into two columns for masonry
  const col1: PinterestPin[] = [];
  const col2: PinterestPin[] = [];
  pins.forEach((pin, i) => {
    if (i % 2 === 0) col1.push(pin);
    else col2.push(pin);
  });

  const renderPin = (pin: PinterestPin) => {
    const imageUrl = getPinImageUrl(pin);
    if (!imageUrl) return null;

    return (
      <TouchableOpacity
        key={pin.id}
        style={styles.pinCard}
        onPress={() => handleSelectPin(pin)}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.pinImage}
          resizeMode="cover"
        />
        {pin.title && (
          <Text style={styles.pinTitle} numberOfLines={2}>
            {pin.title}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (mode === "boards") {
              onClose();
            } else {
              setMode("boards");
              setPins([]);
              setSelectedBoard(null);
            }
          }}
          style={styles.closeBtn}
        >
          <Ionicons
            name={mode === "boards" ? "close" : "chevron-back"}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="logo-pinterest" size={18} color="#E60023" />
          <Text style={styles.headerTitle}>
            {mode === "boards"
              ? "Your Boards"
              : mode === "search"
              ? "Search"
              : selectedBoard?.name || "Pins"}
          </Text>
        </View>
        <TouchableOpacity onPress={handleDisconnect} style={styles.closeBtn}>
          <Ionicons
            name="log-out-outline"
            size={20}
            color={colors.textLight}
          />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your pins..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery("");
              if (mode === "search") {
                setMode("boards");
                setPins([]);
              }
            }}
          >
            <Ionicons name="close-circle" size={18} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#E60023" />
        </View>
      ) : mode === "boards" ? (
        /* Boards grid */
        <FlatList
          data={boards}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.boardsGrid}
          columnWrapperStyle={styles.boardsRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.boardCard}
              onPress={() => loadBoardPins(item)}
              activeOpacity={0.85}
            >
              {item.image_thumbnail_url ? (
                <Image
                  source={{ uri: item.image_thumbnail_url }}
                  style={styles.boardImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.boardImagePlaceholder}>
                  <Ionicons
                    name="grid-outline"
                    size={24}
                    color={colors.mediterranean[200]}
                  />
                </View>
              )}
              <View style={styles.boardInfo}>
                <Text style={styles.boardName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.boardCount}>
                  {item.pin_count} pins
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No boards found</Text>
            </View>
          }
        />
      ) : (
        /* Pins masonry */
        <FlatList
          data={[1]}
          keyExtractor={() => "masonry"}
          contentContainerStyle={styles.pinsContainer}
          onEndReached={loadMorePins}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                color="#E60023"
                style={{ paddingVertical: 20 }}
              />
            ) : null
          }
          renderItem={() => (
            <View style={styles.masonry}>
              <View style={styles.column}>{col1.map(renderPin)}</View>
              <View style={styles.column}>{col2.map(renderPin)}</View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No pins found</Text>
            </View>
          }
        />
      )}

      {/* Import board button */}
      {mode === "board-pins" && selectedBoard && pins.length > 0 && (
        <View style={styles.importBar}>
          <TouchableOpacity
            style={styles.importBtn}
            onPress={() => {
              const pinData = pins
                .map((p) => {
                  const url = getPinImageUrl(p);
                  return url
                    ? {
                        imageUrl: url,
                        title: p.title,
                        description: p.description,
                        sourceUrl:
                          p.link ||
                          `https://www.pinterest.com/pin/${p.id}/`,
                      }
                    : null;
                })
                .filter(Boolean);

              Alert.alert(
                "Import Board",
                `Add all ${pinData.length} pins from "${selectedBoard.name}" to your mood board?`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Import All",
                    onPress: () => {
                      pinData.forEach((pin) => {
                        if (pin) onSelectPin(pin);
                      });
                      Alert.alert(
                        "Imported!",
                        `${pinData.length} pins added to your mood board.`
                      );
                    },
                  },
                ]
              );
            }}
          >
            <Ionicons name="download-outline" size={18} color={colors.white} />
            <Text style={styles.importBtnText}>
              Import All {pins.length} Pins
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: colors.text,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  connectState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  pinterestLogo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  connectTitle: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.text,
  },
  connectSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.textLight,
    textAlign: "center",
    lineHeight: 22,
  },
  connectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#E60023",
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    marginTop: spacing.sm,
  },
  connectBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.white,
  },
  boardsGrid: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  boardsRow: {
    gap: spacing.sm,
  },
  boardCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  boardImage: {
    width: "100%",
    height: COLUMN_WIDTH * 0.7,
  },
  boardImagePlaceholder: {
    width: "100%",
    height: COLUMN_WIDTH * 0.7,
    backgroundColor: colors.sand[100],
    alignItems: "center",
    justifyContent: "center",
  },
  boardInfo: {
    padding: spacing.sm,
  },
  boardName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.text,
  },
  boardCount: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  pinsContainer: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  masonry: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  column: {
    flex: 1,
    gap: spacing.sm,
  },
  pinCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  pinImage: {
    width: "100%",
    height: COLUMN_WIDTH * 1.3,
  },
  pinTitle: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.text,
    padding: spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textLight,
  },
  importBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingBottom: 34,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  importBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: "#E60023",
    borderRadius: borderRadius.xl,
    paddingVertical: 14,
  },
  importBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colors.white,
  },
});
