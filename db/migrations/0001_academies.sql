-- academies 모듈: 학원, 강사, 학생, 반, 반 배정
-- 순수 SQL. 이미 적용된 파일은 고치지 않고 새 번호 파일을 더한다.
-- 학생 개인정보는 이름·학년만 둔다. 연락처·생년월일 등은 결정 전까지 넣지 않는다.

CREATE TABLE academies (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE teachers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES academies (id),
  name       text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (academy_id, id)
);

CREATE TABLE students (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES academies (id),
  name       text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  grade      smallint CHECK (grade BETWEEN 1 AND 12),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (academy_id, id)
);

-- 담당 강사는 같은 학원 소속이어야 한다 (복합 외래키로 DB가 막는다).
CREATE TABLE classes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES academies (id),
  name       text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  teacher_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (academy_id, id),
  FOREIGN KEY (academy_id, teacher_id) REFERENCES teachers (academy_id, id)
);

-- 반과 학생은 같은 학원 소속이어야 한다.
CREATE TABLE class_enrollments (
  academy_id  uuid NOT NULL,
  class_id    uuid NOT NULL,
  student_id  uuid NOT NULL,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, student_id),
  FOREIGN KEY (academy_id, class_id) REFERENCES classes (academy_id, id),
  FOREIGN KEY (academy_id, student_id) REFERENCES students (academy_id, id)
);

CREATE INDEX teachers_academy_id_idx ON teachers (academy_id);
CREATE INDEX students_academy_id_idx ON students (academy_id);
CREATE INDEX classes_academy_id_idx ON classes (academy_id);
CREATE INDEX class_enrollments_student_id_idx ON class_enrollments (student_id);
