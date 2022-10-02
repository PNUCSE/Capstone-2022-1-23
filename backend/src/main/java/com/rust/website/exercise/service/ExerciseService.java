package com.rust.website.exercise.service;

import com.rust.website.compile.model.model.ExecutionConstraints;
import com.rust.website.compile.model.myEnum.Language;
import com.rust.website.exercise.model.entity.Exercise;
import com.rust.website.exercise.model.entity.ExerciseTestcase;
import com.rust.website.exercise.model.entity.ExerciseTry;
import com.rust.website.exercise.model.myEnum.ExerciseDifficulty;
import com.rust.website.exercise.model.myEnum.ExerciseSolved;
import com.rust.website.exercise.model.myEnum.ExerciseTag;
import com.rust.website.exercise.repository.ExerciseContentRepository;
import com.rust.website.exercise.repository.ExerciseRepository;
import com.rust.website.exercise.repository.ExerciseTestcaseRepository;
import com.rust.website.exercise.repository.ExerciseTryRepository;
import com.rust.website.compile.model.dto.CompileInputDTO;
import com.rust.website.compile.model.dto.CompileOutputDTO;
import com.rust.website.common.dto.ResponseDTO;
import com.rust.website.compile.service.CompileService;
import com.rust.website.user.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.*;
import java.util.stream.IntStream;

@Service
@AllArgsConstructor
public class ExerciseService {
    private final CompileService compileService;

    private final ExerciseRepository exerciseRepository;
    private final ExerciseContentRepository exerciseContentRepository;
    private final ExerciseTryRepository exerciseTryRepository;
    private final ExerciseTestcaseRepository exerciseTestcaseRepository;
    private final UserRepository userRepository;


    @Transactional(readOnly = true)
    public List<Exercise> getExercises(String user_id, Pageable pageable)
    {
        Map<Integer, ExerciseTry> exerciseTries = exerciseTryRepository.findByUser_idToMap(user_id);
        List<Exercise> exercises = exerciseRepository.findAllByOrderByIdAsc(pageable).getContent();
        return computeReturnList(exercises, exerciseTries);
    }
    @Transactional(readOnly = true)
    public List<Exercise> getExercises(String user_id, Pageable pageable, ExerciseTag tag)
    {
        Map<Integer, ExerciseTry> exerciseTries = exerciseTryRepository.findByUser_idToMap(user_id);
        List<Exercise> exercises = exerciseRepository.findByTagOrderByIdAsc(tag, pageable).getContent();
        return computeReturnList(exercises, exerciseTries);
    }
    @Transactional(readOnly = true)
    public List<Exercise> getExercises(String user_id, Pageable pageable, ExerciseDifficulty difficulty)
    {
        Map<Integer, ExerciseTry> exerciseTries = exerciseTryRepository.findByUser_idToMap(user_id);
        List<Exercise> exercises = exerciseRepository.findByDifficultyOrderByIdAsc(difficulty, pageable).getContent();
        return computeReturnList(exercises, exerciseTries);
    }

    @Transactional(readOnly = true)
    public List<Exercise> computeReturnList(List<Exercise> exercises, Map<Integer, ExerciseTry> exerciseTries)
    {
        List<Exercise> returnList = new ArrayList<>();
        exercises.stream()
                .forEach(e -> {
                    if (exerciseTries.get(e.getId()) != null) {
                        e.setSolved(exerciseTries.get(e.getId()).getSolved());
                        e.setTryTime(exerciseTries.get(e.getId()).getTime());
                    }
                    else { e.setSolved(ExerciseSolved.NO_TRY);}
                    e.setTime(e.getExerciseContent().getTime());
                    e.setExerciseContent(null);
                    e.setExerciseTestcases(null);
                    returnList.add(e);
                });
        return returnList;
    }

    @Transactional(readOnly = true)
    public long getTotal()
    {
        return exerciseRepository.count();
    }
    @Transactional(readOnly = true)
    public long getTotal(ExerciseTag tag)
    {
        return exerciseRepository.countByTag(tag);
    }
    @Transactional(readOnly = true)
    public long getTotal(ExerciseDifficulty difficulty)
    {
        return exerciseRepository.countByDifficulty(difficulty);
    }

    @Transactional(readOnly = true)
    public Exercise getExercise(int id, String userId)
    {
        Exercise exercise = exerciseRepository.findById(id).get();
        Optional<ExerciseTry> exerciseTry = exerciseTryRepository.findByUser_idAndExercise_id(userId, id);
        if (exerciseTry.isPresent())
        {
            exercise.setSolved(exerciseTry.get().getSolved());
        }
        return exercise;
    }

    @Transactional
    public ResponseDTO<CompileOutputDTO> compileUserCode(CompileInputDTO compileInputDTO, int id, String userId, ExecutionConstraints constraints)
    {
        CompileOutputDTO compileOutputDTO = new CompileOutputDTO();
        Exercise exercise = exerciseRepository.findById(id).get();
        List<ExerciseTestcase> exerciseTestcases = exercise.getExerciseTestcases();

        HashMap<String, String> result = compileService.exerciseCompile(compileInputDTO, constraints, exerciseTestcases);

        ExerciseTry exerciseTry =  exerciseTryRepository.findByUser_idAndExercise_id(userId, id).orElse(null);
        if (exerciseTry == null) {
            exerciseTry = ExerciseTry.builder()
                    .exercise(exercise)
                    .user(userRepository.findById(userId).get())
                    .build();
        }
        exerciseTry.setSourceCode(compileInputDTO.getCode());

        if (result.get("success").equals("false"))
        {
            exerciseTry.setSolved(ExerciseSolved.FAIL);
            compileOutputDTO.setStdOut("컴파일실패.");
        }
        else {
            if (exerciseTestcases.size() == Integer.valueOf(result.get("index")))
            {
                exerciseTry.setSolved(ExerciseSolved.SOLVE);
                exerciseTry.setTime(Integer.valueOf(result.get("time")));
                compileOutputDTO.setStdOut("맞았습니다.");
                compileOutputDTO.setTime(Integer.valueOf(result.get("time")));
            }
            else
            {
                exerciseTry.setSolved(ExerciseSolved.FAIL);
                compileOutputDTO.setStdOut("틀렸습니다.");
            }
        }
        exerciseTryRepository.save(exerciseTry);

        ResponseDTO<CompileOutputDTO> responseDTO = new ResponseDTO<CompileOutputDTO>(HttpStatus.OK.value(), compileOutputDTO);
        return responseDTO;
    }

    @Transactional
    public ResponseDTO<String> addExercise(Exercise exercise)
    {
        ResponseDTO<String> responseDTO = new ResponseDTO<>(HttpStatus.OK.value(), "추가가 완료되었습니다.");
        exercise.getExerciseContent().setExercise(exercise);
        List<ExerciseTestcase> exerciseTestcases = exercise.getExerciseTestcases();
        IntStream.range(0, exerciseTestcases.size())
                        .forEach(i -> exerciseTestcases.get(i).setExercise(exercise));
        exerciseRepository.save(exercise);
        return responseDTO;
    }

    @Transactional
    public ResponseDTO<String> updateExercise(Exercise newExercise, int id)
    {
        ResponseDTO<String> responseDTO = new ResponseDTO<>(HttpStatus.OK.value(), "수정이 완료되었습니다.");
        Exercise exercise = exerciseRepository.findById(id).get();
        exercise.copy(newExercise);
        System.out.println(exercise.getExerciseTestcases());
        //+ 테스트 케이스 바껴도 재채점
        if(!exercise.getExerciseContent().getTestCode().equals(newExercise.getExerciseContent().getTestCode())
                || !exercise.getExerciseTestcases().equals(newExercise.getExerciseTestcases()))
        {
            updateTestCodeAndExecutionTime(exercise, newExercise);
        }
        exercise.getExerciseContent().copy(newExercise.getExerciseContent());

        exerciseTestcaseRepository.deleteByExercise_id(id);
        exerciseTestcaseRepository.flush();
        List<ExerciseTestcase> exerciseTestcases = newExercise.getExerciseTestcases();
        IntStream.range(0, exerciseTestcases.size())
                .mapToObj(i -> ExerciseTestcase.builder()
                        .exercise(exercise)
                        .input(exerciseTestcases.get(i).getInput())
                        .output(exerciseTestcases.get(i).getOutput())
                        .build()
                )
                .forEach(tc -> exerciseTestcaseRepository.save(tc));

        return responseDTO;
    }

    @Transactional
    public ResponseDTO<String> deleteExercise(int id)
    {
        ResponseDTO<String> responseDTO = new ResponseDTO<>(HttpStatus.OK.value(), "삭제가 완료되었습니다.");
        exerciseTryRepository.deleteByExercise_id(id);
        exerciseRepository.deleteById(id);

        return responseDTO;
    }

    @Transactional(readOnly = true)
    public Collection<Exercise> getExerciseByTag(List<ExerciseTag> relationList)
    {
        return exerciseRepository.findExercisesByTagInAndDifficultyIsLessThanEqual(relationList, ExerciseDifficulty.STAR3);
    }

    @Transactional(readOnly = true)
    public Collection<ExerciseTry> getExerciseTryByUsernameAndExerciseId(String userId, ExerciseSolved solved, List<Exercise> exerciseList)
    {
        return exerciseTryRepository.findByUser_idAndSolvedAndExerciseIn(userId,solved,exerciseList);
    }

    void updateTestCodeAndExecutionTime(Exercise exercise, Exercise newExercise) //컴파일 할 때 newexercise의 테스트케이스 사용
    {
        CompileInputDTO compileInputDTO = CompileInputDTO.builder()
                .code(newExercise.getExerciseContent().getTestCode())
                .language(Language.RUST)
                .build();
        ExecutionConstraints constraints = ExecutionConstraints.builder()
                .memoryLimit(200)
                .timeLimit(10000)
                .build();
        long runTime = 0;

        int idx = 0;
        for(;idx < newExercise.getExerciseTestcases().size(); idx++)
        {
            compileInputDTO.setStdIn(newExercise.getExerciseTestcases().get(idx).getInput());
            CompileOutputDTO temp = compileService.onlineCompile(compileInputDTO, constraints);
            if(!temp.getStdOut().equals(newExercise.getExerciseTestcases().get(idx).getOutput()))
            {
                break;
            }
            runTime = Math.max(temp.getTime(), runTime);
        }

        if(idx != newExercise.getExerciseTestcases().size())
        {
            throw new IllegalArgumentException("wrong test code");
        }

        exercise.getExerciseContent().setTime(runTime);
        exercise.getExerciseContent().setTestCode(newExercise.getExerciseContent().getTestCode());
    }
}
