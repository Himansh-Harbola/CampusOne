import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Page from '../components/ui/Page';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Btn from '../components/ui/Btn';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Avatar from '../components/ui/Avatar';
import { MOCK_USERS } from '../data/mockData';

// ─── Teacher: quiz detail ────────────────────────────────────
function TeacherQuizDetail({ quiz, onBack }) {
  const { quizzes, classes, allUsers } = useApp();
  const liveQuiz = quizzes.find((q) => q.id === quiz.id) || quiz;
  const cls      = classes.find((c) => c.id === liveQuiz.classId);
  const subs     = Object.entries(liveQuiz.submissions || {});

  return (
    <Page
      title={liveQuiz.title}
      subtitle={`${cls?.name} · ${subs.length} submissions`}
      actions={<Btn variant="secondary" onClick={onBack}>← Back</Btn>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Questions */}
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#f1f5f9' }}>
            Questions ({liveQuiz.questions.length})
          </h3>
          {liveQuiz.questions.map((q, i) => (
            <div
              key={q.id || i}
              style={{
                marginBottom: 16,
                padding: '14px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 10,
              }}
            >
              <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 500, color: '#e2e8f0' }}>
                {i + 1}. {q.text}
              </p>
              {q.options.map((opt, j) => (
                <div
                  key={j}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 0',
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      border: `2px solid ${j === q.correct ? '#6366f1' : 'rgba(255,255,255,0.2)'}`,
                      background: j === q.correct ? '#6366f1' : 'transparent',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      color: j === q.correct ? '#a5b4fc' : 'rgba(255,255,255,0.45)',
                    }}
                  >
                    {opt}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </Card>

        {/* Submissions */}
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#f1f5f9' }}>
            Student Scores
          </h3>
          {subs.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              No submissions yet
            </p>
          ) : (
            subs.map(([sid, sub]) => {
              const student = allUsers.find((u) => u.id === sid);
              const pct     = Math.round((sub.score / liveQuiz.maxScore) * 100);
              return (
                <div
                  key={sid}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <Avatar
                    initials={student?.avatar || sid.slice(0, 2).toUpperCase()}
                    size={32}
                    colorIndex={allUsers.findIndex((u) => u.id === sid)}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#e2e8f0' }}>
                      {student?.name || sid}
                    </p>
                    <div
                      style={{
                        height: 4,
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        marginTop: 5,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background:
                            pct >= 70
                              ? '#059669'
                              : pct >= 50
                              ? '#d97706'
                              : '#dc2626',
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color:
                        pct >= 70 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#f87171',
                    }}
                  >
                    {sub.score}/{liveQuiz.maxScore}
                  </span>
                </div>
              );
            })
          )}
        </Card>
      </div>
    </Page>
  );
}

// ─── Teacher: create quiz modal ──────────────────────────────
function CreateQuizModal({ onClose, myClasses }) {
  const { setQuizzes, user } = useApp();
  const [title, setTitle]     = useState('');
  const [classId, setClassId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [questions, setQuestions] = useState([
    { text: '', options: ['', '', '', ''], correct: 0 },
  ]);

  function updateQ(qi, key, val) {
    setQuestions((prev) => {
      const n = [...prev];
      n[qi] = { ...n[qi], [key]: val };
      return n;
    });
  }

  function updateOption(qi, oi, val) {
    setQuestions((prev) => {
      const n = [...prev];
      const opts = [...n[qi].options];
      opts[oi] = val;
      n[qi] = { ...n[qi], options: opts };
      return n;
    });
  }

  function create() {
    if (!title || !classId || !deadline) return;
    const nq = {
      id:        'q' + Date.now(),
      title,
      classId,
      teacherId: user.id,
      deadline,
      status:    new Date(deadline) > new Date() ? 'upcoming' : 'active',
      questions,
      maxScore:  questions.length * 10,
      submissions: {},
    };
    setQuizzes((prev) => [...prev, nq]);
    onClose();
  }

  const selectStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 9,
    border: '1px solid rgba(255,255,255,0.12)',
    background: '#0f1117',
    color: '#e2e8f0',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    marginBottom: 16,
  };

  return (
    <Modal title="Create Quiz" onClose={onClose} wide>
      <Input
        label="Quiz Title *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Mid-Term Quiz"
      />

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
          Class *
        </label>
        <select value={classId} onChange={(e) => setClassId(e.target.value)} style={selectStyle}>
          <option value="">Select class</option>
          {myClasses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <Input
        label="Deadline *"
        type="datetime-local"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
      />

      <h4 style={{ margin: '16px 0 12px', color: '#e2e8f0', fontSize: 14, fontWeight: 600 }}>
        Questions
      </h4>

      {questions.map((q, qi) => (
        <div
          key={qi}
          style={{
            padding: '14px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          <input
            value={q.text}
            onChange={(e) => updateQ(qi, 'text', e.target.value)}
            placeholder={`Question ${qi + 1}`}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 7,
              border: '1px solid rgba(255,255,255,0.1)',
              background: '#0f1117',
              color: '#e2e8f0',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: 10,
              fontFamily: 'inherit',
            }}
          />
          {q.options.map((opt, oi) => (
            <div
              key={oi}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}
            >
              <button
                onClick={() => updateQ(qi, 'correct', oi)}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: `2px solid ${oi === q.correct ? '#6366f1' : 'rgba(255,255,255,0.2)'}`,
                  background: oi === q.correct ? '#6366f1' : 'transparent',
                  cursor: 'pointer',
                  flexShrink: 0,
                  padding: 0,
                }}
              />
              <input
                value={opt}
                onChange={(e) => updateOption(qi, oi, e.target.value)}
                placeholder={`Option ${oi + 1}`}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 7,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: '#0f1117',
                  color: '#e2e8f0',
                  fontSize: 12,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          ))}
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Btn
          variant="secondary"
          small
          onClick={() =>
            setQuestions((prev) => [
              ...prev,
              { text: '', options: ['', '', '', ''], correct: 0 },
            ])
          }
        >
          + Add Question
        </Btn>
        <Btn onClick={create}>Create Quiz</Btn>
      </div>
    </Modal>
  );
}

// ─── Teacher: quizzes list ───────────────────────────────────
function TeacherQuizzes() {
  const { user, quizzes, classes } = useApp();
  const [selected, setSelected]     = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const myClasses = classes.filter((c) => c.teacherId === user.id);
  const myQuizzes = quizzes.filter((q) => q.teacherId === user.id);

  if (selected) {
    return <TeacherQuizDetail quiz={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <Page
      title="Quizzes"
      subtitle="Create quizzes and track student performance"
      actions={<Btn onClick={() => setShowCreate(true)}>+ Create Quiz</Btn>}
    >
      {myQuizzes.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ fontSize: 40, marginBottom: 8 }}>📝</p>
          <p style={{ color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>No quizzes yet</p>
          <Btn onClick={() => setShowCreate(true)}>Create First Quiz</Btn>
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px,1fr))',
            gap: 16,
          }}
        >
          {myQuizzes.map((q) => {
            const cls      = classes.find((c) => c.id === q.classId);
            const subCount = Object.keys(q.submissions || {}).length;
            return (
              <QuizCard
                key={q.id}
                quiz={q}
                cls={cls}
                subCount={subCount}
                onClick={() => setSelected(q)}
              />
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateQuizModal onClose={() => setShowCreate(false)} myClasses={myClasses} />
      )}
    </Page>
  );
}

function QuizCard({ quiz, cls, subCount, onClick, onAttempt, attempted, score, maxScore }) {
  const [hovered, setHovered] = useState(false);
  const pct = score != null ? Math.round((score / maxScore) * 100) : null;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#1a1d2e',
        border: `1px solid ${hovered ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 16,
        padding: '20px 22px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Badge
          color={quiz.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(217,119,6,0.15)'}
          textColor={quiz.status === 'active' ? '#34d399' : '#fbbf24'}
        >
          {quiz.status}
        </Badge>
        {pct != null && (
          <Badge
            color={pct >= 70 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}
            textColor={pct >= 70 ? '#34d399' : '#f87171'}
          >
            {score}/{maxScore}
          </Badge>
        )}
      </div>
      <h3 style={{ margin: '0 0 5px', fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>
        {quiz.title}
      </h3>
      <p style={{ margin: '0 0 14px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
        {cls?.name} ·{' '}
        {new Date(quiz.deadline).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
        })}
      </p>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <Badge>{quiz.questions.length} questions</Badge>
          {subCount != null && (
            <Badge color="rgba(16,185,129,0.1)" textColor="#34d399">
              {subCount} submitted
            </Badge>
          )}
        </div>
        {onAttempt && !attempted && quiz.status === 'active' && (
          <Btn
            small
            onClick={(e) => {
              e.stopPropagation();
              onAttempt();
            }}
          >
            Attempt
          </Btn>
        )}
      </div>
    </div>
  );
}

// ─── Student: attempt quiz ───────────────────────────────────
function AttemptQuiz({ quiz, onDone, onBack }) {
  const { quizzes, setQuizzes, user } = useApp();
  const [answers, setAnswers] = useState({});
  const [result, setResult]   = useState(null);

  function submit() {
    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correct) score += Math.floor(quiz.maxScore / quiz.questions.length);
    });
    setQuizzes((prev) =>
      prev.map((q) =>
        q.id === quiz.id
          ? {
              ...q,
              submissions: {
                ...q.submissions,
                [user.id]: { answers: Object.values(answers), score, submitted: true },
              },
            }
          : q,
      ),
    );
    setResult({ score, max: quiz.maxScore });
  }

  if (result) {
    const pct = Math.round((result.score / result.max) * 100);
    return (
      <Page
        title="Quiz Submitted!"
        actions={<Btn onClick={onDone}>← Back to Quizzes</Btn>}
      >
        <Card style={{ textAlign: 'center', padding: '60px 40px' }}>
          <p style={{ fontSize: 64, marginBottom: 8 }}>
            {pct >= 70 ? '🎉' : pct >= 50 ? '👍' : '😔'}
          </p>
          <p style={{ fontSize: 40, fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px' }}>
            {result.score}/{result.max}
          </p>
          <p
            style={{
              fontSize: 22,
              color: pct >= 70 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#f87171',
              margin: '0 0 10px',
            }}
          >
            {pct}%
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>
            {pct >= 70 ? 'Excellent work!' : pct >= 50 ? 'Good effort!' : 'Keep practising!'}
          </p>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title={quiz.title}
      subtitle={`${quiz.questions.length} questions · ${quiz.maxScore} marks`}
      actions={
        <>
          <Btn variant="secondary" onClick={onBack}>← Back</Btn>
          <Btn
            onClick={submit}
            disabled={Object.keys(answers).length < quiz.questions.length}
          >
            Submit Quiz
          </Btn>
        </>
      }
    >
      {quiz.questions.map((q, i) => (
        <Card key={i} style={{ marginBottom: 14 }}>
          <p style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 500, color: '#f1f5f9' }}>
            {i + 1}. {q.text}
          </p>
          {q.options.map((opt, j) => (
            <button
              key={j}
              onClick={() => setAnswers((prev) => ({ ...prev, [i]: j }))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: `1px solid ${answers[i] === j ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                background: answers[i] === j ? 'rgba(99,102,241,0.1)' : 'transparent',
                color: answers[i] === j ? '#a5b4fc' : 'rgba(255,255,255,0.6)',
                fontSize: 14,
                cursor: 'pointer',
                marginBottom: 8,
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: `2px solid ${answers[i] === j ? '#6366f1' : 'rgba(255,255,255,0.2)'}`,
                  background: answers[i] === j ? '#6366f1' : 'transparent',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              />
              {opt}
            </button>
          ))}
        </Card>
      ))}
    </Page>
  );
}

// ─── Student: quizzes list ───────────────────────────────────
function StudentQuizzes() {
  const { user, quizzes, classes } = useApp();
  const [attempting, setAttempting] = useState(null);

  const myClasses = classes.filter((c) => c.students.includes(user.id));
  const myQuizzes = quizzes.filter((q) => myClasses.some((c) => c.id === q.classId));

  if (attempting) {
    return (
      <AttemptQuiz
        quiz={attempting}
        onDone={() => setAttempting(null)}
        onBack={() => setAttempting(null)}
      />
    );
  }

  return (
    <Page title="Quizzes" subtitle="Attempt active quizzes and view your results">
      {myQuizzes.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)' }}>No quizzes available yet</p>
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px,1fr))',
            gap: 16,
          }}
        >
          {myQuizzes.map((q) => {
            const cls = classes.find((c) => c.id === q.classId);
            const sub = q.submissions?.[user.id];
            return (
              <QuizCard
                key={q.id}
                quiz={q}
                cls={cls}
                attempted={!!sub}
                score={sub?.score}
                maxScore={q.maxScore}
                onAttempt={() => setAttempting(q)}
              />
            );
          })}
        </div>
      )}
    </Page>
  );
}

export default function Quizzes() {
  const { user } = useApp();
  return user.role === 'teacher' ? <TeacherQuizzes /> : <StudentQuizzes />;
}
