import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, borderRadius } from "../lib/theme";
import { Trip, Poll, PollOption, PollVote } from "../types";

interface Props {
  trip: Trip;
  userId: string;
  userName: string;
}

export default function PollsTab({ trip, userId, userName }: Props) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState("");
  const [pollType, setPollType] = useState<"single" | "multiple" | "ranked">("single");
  const [options, setOptions] = useState<string[]>(["", ""]);

  const addOption = () => {
    setOptions((prev) => [...prev, ""]);
  };

  const updateOption = (index: number, text: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? text : o)));
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const createPoll = () => {
    const validOptions = options.filter((o) => o.trim());
    if (!question.trim() || validOptions.length < 2) {
      Alert.alert("Need more info", "Add a question and at least 2 options.");
      return;
    }

    const newPoll: Poll = {
      id: Date.now().toString(),
      trip_id: trip.id,
      question: question.trim(),
      type: pollType,
      status: "open",
      created_by: userId,
      created_by_name: userName,
      created_at: new Date().toISOString(),
      closes_at: null,
      options: validOptions.map((text, i) => ({
        id: `${Date.now()}-${i}`,
        poll_id: Date.now().toString(),
        text,
        image_url: null,
        source_url: null,
        votes: [],
      })),
    };

    setPolls((prev) => [newPoll, ...prev]);
    setQuestion("");
    setOptions(["", ""]);
    setShowCreate(false);
  };

  const vote = (pollId: string, optionId: string) => {
    setPolls((prev) =>
      prev.map((poll) => {
        if (poll.id !== pollId) return poll;

        return {
          ...poll,
          options: poll.options.map((opt) => {
            const hasVoted = opt.votes.some((v) => v.user_id === userId);
            const otherHasVoted = poll.options.some(
              (o) => o.id !== opt.id && o.votes.some((v) => v.user_id === userId)
            );

            if (opt.id === optionId) {
              if (hasVoted) {
                // Remove vote
                return {
                  ...opt,
                  votes: opt.votes.filter((v) => v.user_id !== userId),
                };
              }
              // Add vote (remove from others if single choice)
              const newVote: PollVote = {
                user_id: userId,
                user_name: userName,
                rank: null,
              };
              return { ...opt, votes: [...opt.votes, newVote] };
            }

            // For single choice, remove vote from other options
            if (poll.type === "single" && !hasVoted) {
              return {
                ...opt,
                votes: opt.votes.filter((v) => v.user_id !== userId),
              };
            }
            return opt;
          }),
        };
      })
    );
  };

  const closePoll = (pollId: string) => {
    setPolls((prev) =>
      prev.map((p) => (p.id === pollId ? { ...p, status: "closed" as const } : p))
    );
  };

  const totalVoters = (poll: Poll) => {
    const voterIds = new Set<string>();
    poll.options.forEach((opt) => opt.votes.forEach((v) => voterIds.add(v.user_id)));
    return voterIds.size;
  };

  const pollTypeLabels = {
    single: "Pick one",
    multiple: "Pick multiple",
    ranked: "Rank choices",
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Create poll button */}
      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => setShowCreate(!showCreate)}
      >
        <Ionicons
          name={showCreate ? "close-circle-outline" : "add-circle-outline"}
          size={20}
          color={colors.mediterranean[600]}
        />
        <Text style={styles.createBtnText}>
          {showCreate ? "Cancel" : "Create a Poll"}
        </Text>
      </TouchableOpacity>

      {/* Create form */}
      {showCreate && (
        <View style={styles.createForm}>
          <TextInput
            style={styles.questionInput}
            placeholder="What do you want to decide? (e.g. 'Where should we eat Saturday?')"
            placeholderTextColor={colors.textLight}
            value={question}
            onChangeText={setQuestion}
            multiline
            autoFocus
          />

          {/* Poll type */}
          <View style={styles.typeSelector}>
            {(["single", "multiple", "ranked"] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeBtn,
                  pollType === type && styles.typeBtnActive,
                ]}
                onPress={() => setPollType(type)}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    pollType === type && styles.typeBtnTextActive,
                  ]}
                >
                  {pollTypeLabels[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Options */}
          <Text style={styles.optionsLabel}>Options</Text>
          {options.map((opt, i) => (
            <View key={i} style={styles.optionRow}>
              <View style={styles.optionNumber}>
                <Text style={styles.optionNumberText}>{i + 1}</Text>
              </View>
              <TextInput
                style={styles.optionInput}
                placeholder={`Option ${i + 1}`}
                placeholderTextColor={colors.textLight}
                value={opt}
                onChangeText={(text) => updateOption(i, text)}
              />
              {options.length > 2 && (
                <TouchableOpacity
                  onPress={() => removeOption(i)}
                  style={styles.removeOption}
                >
                  <Ionicons name="close" size={16} color={colors.textLight} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.addOptionBtn} onPress={addOption}>
            <Ionicons name="add" size={16} color={colors.mediterranean[400]} />
            <Text style={styles.addOptionText}>Add option</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitPollBtn} onPress={createPoll}>
            <Text style={styles.submitPollText}>Create Poll</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Polls list */}
      {polls.map((poll) => {
        const maxVotes = Math.max(...poll.options.map((o) => o.votes.length), 1);
        const voters = totalVoters(poll);

        return (
          <View key={poll.id} style={styles.pollCard}>
            <View style={styles.pollHeader}>
              <View style={styles.pollMeta}>
                <Text style={styles.pollCreator}>
                  {poll.created_by_name || "Someone"} asked
                </Text>
                {poll.status === "closed" && (
                  <View style={styles.closedBadge}>
                    <Text style={styles.closedText}>Closed</Text>
                  </View>
                )}
              </View>
              <Text style={styles.pollQuestion}>{poll.question}</Text>
              <Text style={styles.pollTypeLabel}>
                {pollTypeLabels[poll.type]} &middot; {voters}{" "}
                {voters === 1 ? "vote" : "votes"}
              </Text>
            </View>

            {/* Options */}
            <View style={styles.pollOptions}>
              {poll.options.map((opt) => {
                const myVote = opt.votes.some((v) => v.user_id === userId);
                const votePercent =
                  voters > 0
                    ? Math.round((opt.votes.length / maxVotes) * 100)
                    : 0;
                const isWinning =
                  opt.votes.length === maxVotes && opt.votes.length > 0;

                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.pollOption,
                      myVote && styles.pollOptionVoted,
                    ]}
                    onPress={() =>
                      poll.status === "open" && vote(poll.id, opt.id)
                    }
                    disabled={poll.status === "closed"}
                    activeOpacity={0.7}
                  >
                    {/* Progress bar */}
                    <View
                      style={[
                        styles.pollOptionFill,
                        {
                          width: `${votePercent}%`,
                          backgroundColor: myVote
                            ? colors.mediterranean[100]
                            : colors.sand[100],
                        },
                      ]}
                    />
                    <View style={styles.pollOptionContent}>
                      <View style={styles.pollOptionLeft}>
                        {myVote ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={colors.mediterranean[600]}
                          />
                        ) : (
                          <Ionicons
                            name="ellipse-outline"
                            size={20}
                            color={colors.border}
                          />
                        )}
                        <Text
                          style={[
                            styles.pollOptionText,
                            myVote && styles.pollOptionTextVoted,
                            isWinning && styles.pollOptionTextWinning,
                          ]}
                        >
                          {opt.text}
                        </Text>
                      </View>
                      <View style={styles.pollOptionRight}>
                        {opt.votes.length > 0 && (
                          <Text style={styles.voteCount}>
                            {opt.votes.length}
                          </Text>
                        )}
                        {/* Voter avatars */}
                        <View style={styles.voterAvatars}>
                          {opt.votes.slice(0, 3).map((v, i) => (
                            <View
                              key={v.user_id}
                              style={[
                                styles.voterCircle,
                                { marginLeft: i > 0 ? -6 : 0 },
                              ]}
                            >
                              <Text style={styles.voterInitial}>
                                {v.user_name[0]}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Close poll (for creator) */}
            {poll.created_by === userId && poll.status === "open" && (
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => closePoll(poll.id)}
              >
                <Text style={styles.closeBtnText}>Close Poll</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {polls.length === 0 && !showCreate && (
        <View style={styles.emptyState}>
          <Ionicons
            name="bar-chart-outline"
            size={40}
            color={colors.mediterranean[200]}
          />
          <Text style={styles.emptyTitle}>No polls yet</Text>
          <Text style={styles.emptySubtitle}>
            Create a poll to help your group decide on restaurants, hotels,
            activities, and more
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 100 },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  createBtnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.mediterranean[600],
  },
  createForm: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  questionInput: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.sand[50],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 50,
  },
  typeSelector: {
    flexDirection: "row",
    backgroundColor: colors.mediterranean[50],
    borderRadius: borderRadius.lg,
    padding: 3,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  typeBtnActive: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  typeBtnText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textLight,
  },
  typeBtnTextActive: {
    fontFamily: fonts.sansSemiBold,
    color: colors.mediterranean[600],
  },
  optionsLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.text,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  optionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.mediterranean[50],
    alignItems: "center",
    justifyContent: "center",
  },
  optionNumberText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.mediterranean[500],
  },
  optionInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.sand[50],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  removeOption: {
    padding: 4,
  },
  addOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addOptionText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.mediterranean[400],
  },
  submitPollBtn: {
    backgroundColor: colors.mediterranean[600],
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitPollText: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colors.white,
  },
  pollCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  pollHeader: {
    padding: spacing.md,
    gap: 4,
  },
  pollMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pollCreator: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textLight,
  },
  closedBadge: {
    backgroundColor: colors.sand[200],
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  closedText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    color: colors.textLight,
  },
  pollQuestion: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: colors.text,
  },
  pollTypeLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textLight,
  },
  pollOptions: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  pollOption: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    position: "relative",
  },
  pollOptionVoted: {
    borderColor: colors.mediterranean[300],
  },
  pollOptionFill: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: borderRadius.lg,
  },
  pollOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
    zIndex: 1,
  },
  pollOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  pollOptionText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.text,
  },
  pollOptionTextVoted: {
    fontFamily: fonts.sansBold,
    color: colors.mediterranean[600],
  },
  pollOptionTextWinning: {
    color: colors.olive[400],
  },
  pollOptionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  voteCount: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: colors.textLight,
  },
  voterAvatars: {
    flexDirection: "row",
  },
  voterCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.mediterranean[400],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  voterInitial: {
    fontFamily: fonts.sansBold,
    fontSize: 9,
    color: colors.white,
  },
  closeBtn: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 12,
    alignItems: "center",
  },
  closeBtnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.textLight,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 50,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.mediterranean[300],
  },
  emptySubtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textLight,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 20,
  },
});
