'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

type Position = { x: number; y: number } | null;

export default function Home() {
    // 게임 시작 상태 추가
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false); // 게임 오버 상태


    const [volume, setVolume] = useState(1); // 볼륨 상태 (기본 값은 1, 최대 볼륨)
    const audioRef = useRef<HTMLAudioElement | null>(null); // 오디오 요소 참조

    // 게임 시작 처리 함수 (배경 음악 재생 추가)
    const handleGameStart = () => {
        setGameStarted(true);
        setGameOver(false); // 게임 오버 상태 초기화
        if (audioRef.current) {
            audioRef.current.play(); // 게임 시작 시 배경음악 재생
        }
    };

    // 볼륨 조절 함수
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume; // 볼륨 변경
        }
    };

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume; // 초기 볼륨 설정
        }
    }, [volume]);


    // 초기 그리드 생성 함수 (Math.random()을 클라이언트에서만 실행)
    const generateGrid = () => {
        return Array.from({ length: 10 }, () =>
            Array.from({ length: 20 }, () => ({
                carrot: '🥕',
                number: Math.floor(Math.random() * 9) + 1,
            }))
        );
    };

    const [grid, setGrid] = useState<{ carrot: string; number: number }[][] | null>(null);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(120);
    const [showImage, setShowImage] = useState(false);
    const [feedbackEmoji, setFeedbackEmoji] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState<Position>(null);
    const [currentPos, setCurrentPos] = useState<Position>(null);
    const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set());

    // 타이머 시작 (게임 시작 후에만)
    useEffect(() => {
        if (gameStarted) {
            const timerId = setInterval(() => {
                setTimeLeft((prevTime) => {
                    if (prevTime <= 1) {
                        clearInterval(timerId);
                        setGameOver(true); // 타이머 종료 시 게임 오버 처리
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);

            return () => clearInterval(timerId);
        }
    }, [gameStarted]);

    // 게임 시작 시 배경음악 재생
    useEffect(() => {
        if (gameStarted && audioRef.current) {
            audioRef.current.play();
        }
    }, [gameStarted]);

    // 그리드 업데이트 및 이미지 표시 (게임 시작 후에만)
    useEffect(() => {
        if (gameStarted && typeof window !== 'undefined') {
            const showImageAndChangeGrid = () => {
                setShowImage(true);

                const hideImageTimeout = setTimeout(() => {
                    setShowImage(false);

                    setGrid((prevGrid) => {
                        const newGrid = [...prevGrid!];
                        const cellsToChange = getRandomCells(10, newGrid);
                        cellsToChange.forEach(([row, col]) => {
                            newGrid[row][col] = { carrot: '🐾', number: newGrid[row][col].number };
                        });
                        return newGrid;
                    });
                }, 1500);

                return () => clearTimeout(hideImageTimeout);
            };

            const firstInterval = setTimeout(() => {
                showImageAndChangeGrid();
            }, 30000);

            const secondInterval = setTimeout(() => {
                showImageAndChangeGrid();
            }, 60000);

            return () => {
                clearTimeout(firstInterval);
                clearTimeout(secondInterval);
            };
        }
    }, [gameStarted]);

    // 랜덤 셀을 반환하는 함수
    const getRandomCells = (count: number, grid: { carrot: string; number: number }[][]) => {
        const cells: [number, number][] = [];
        const availableCells: [number, number][] = []; // [number, number] 타입으로 설정

        // 사용 가능한 셀을 availableCells 배열에 넣음
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 20; col++) {
                if (grid[row][col].carrot !== '' && grid[row][col].number > 0) {
                    availableCells.push([row, col]); // [row, col] 튜플을 추가
                }
            }
        }

        // 랜덤으로 셀을 선택
        while (cells.length < count && availableCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableCells.length);
            const cell = availableCells[randomIndex]; // [row, col] 튜플
            cells.push(cell); // [row, col] 튜플을 cells 배열에 추가
            availableCells.splice(randomIndex, 1); // 선택된 셀을 배열에서 제거
        }

        return cells;
    };

    // 마우스 이벤트 처리
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setStartPos({ x, y });
        setCurrentPos({ x, y });
        setIsDragging(true);
    };


    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setCurrentPos({ x, y });

        const x1 = Math.min(startPos!.x, x);
        const x2 = Math.max(startPos!.x, x);
        const y1 = Math.min(startPos!.y, y);
        const y2 = Math.max(startPos!.y, y);

        const cellWidth = 960 / 20;
        const cellHeight = 470 / 10;

        const newHighlighted = new Set<string>();

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 20; col++) {
                const cellX = col * cellWidth;
                const cellY = row * cellHeight;

                if (
                    cellX + cellWidth >= x1 &&
                    cellX <= x2 &&
                    cellY + cellHeight >= y1 &&
                    cellY <= y2
                ) {
                    newHighlighted.add(`${row}-${col}`);
                }
            }
        }

        setHighlightedCells(newHighlighted);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setStartPos(null);
        setCurrentPos(null);

        const sum = Array.from(highlightedCells).reduce((acc, key) => {
            const [row, col] = key.split('-').map(Number);
            return acc + grid![row][col].number;
        }, 0);

        if (sum === 10) {
            let includesPaw = false;

            highlightedCells.forEach((key) => {
                const [row, col] = key.split('-').map(Number);
                if (grid![row][col].carrot === '🐾') {
                    includesPaw = true;
                }
            });

            const newGrid = [...grid!];

            highlightedCells.forEach((key) => {
                const [row, col] = key.split('-').map(Number);
                newGrid[row][col] = { carrot: '', number: 0 };
            });

            setGrid(newGrid);

            if (includesPaw) {
                const addPoints = Math.random() < 0.5;
                setScore((prevScore) => prevScore + (addPoints ? 20 : -20));

                setFeedbackEmoji(addPoints ? '+20' : '-20');
                setTimeout(() => setFeedbackEmoji(null), 5000);
            } else {
                setScore((prevScore) => prevScore + 10);
            }
        }

        setHighlightedCells(new Set());
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        setStartPos({ x, y });
        setCurrentPos({ x, y });
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        setCurrentPos({ x, y });

        const x1 = Math.min(startPos!.x, x);
        const x2 = Math.max(startPos!.x, x);
        const y1 = Math.min(startPos!.y, y);
        const y2 = Math.max(startPos!.y, y);

        const cellWidth = 350 / 20;
        const cellHeight = 200 / 10;

        const newHighlighted = new Set<string>();

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 20; col++) {
                const cellX = col * cellWidth;
                const cellY = row * cellHeight;

                if (
                    cellX + cellWidth >= x1 &&
                    cellX <= x2 &&
                    cellY + cellHeight >= y1 &&
                    cellY <= y2
                ) {
                    newHighlighted.add(`${row}-${col}`);
                }
            }
        }

        setHighlightedCells(newHighlighted);
    };

    const handleTouchEnd = () => {
        handleMouseUp(); // 로직은 동일하므로 재사용
    };


    const getSelectionStyle = () => {
        if (!startPos || !currentPos) return { display: 'none' };

        const x = Math.min(startPos.x, currentPos.x);
        const y = Math.min(startPos.y, currentPos.y);
        const width = Math.abs(startPos.x - currentPos.x);
        const height = Math.abs(startPos.y - currentPos.y);

        return {
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
            display: 'block',
        };
    };

    // 클라이언트에서만 그리드 생성
    useEffect(() => {
        if (grid === null && gameStarted) {
            const newGrid = generateGrid();
            setGrid(newGrid);
        }
    }, [grid, gameStarted]);


    const [pos, setPos] = useState({ x: 100, y: 100 });
    const sliderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            const rect = sliderRef.current?.getBoundingClientRect();
            if (!rect) return;

            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const dx = mouseX - centerX;
            const dy = mouseY - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const threshold = 120; // 반응 거리

            if (distance < threshold) {
                const angle = Math.atan2(dy, dx);
                const moveX = -Math.cos(angle) * 100; // 반대 방향
                const moveY = -Math.sin(angle) * 100;

                const newX = pos.x + moveX + (Math.random() * 40 - 20); // 랜덤성 추가
                const newY = pos.y + moveY + (Math.random() * 40 - 20);

                const clampedX = Math.max(0, Math.min(window.innerWidth - 200, newX));
                const clampedY = Math.max(0, Math.min(window.innerHeight - 60, newY));

                setPos({ x: clampedX, y: clampedY });
            }
        };

        const animate = () => {
            window.addEventListener('mousemove', handleMouseMove);
            return () => window.removeEventListener('mousemove', handleMouseMove);
        };

        animate();
    }, [pos]);

    return (
        <div className="w-full h-screen bg-white flex justify-center items-center flex-col relative ">


            {!gameStarted &&  (
                <div className="absolute text-white z-20 py-2 px-6 rounded text-center">
                    <Image
                        src="/pochacco.png"
                        alt="pochacco"
                        width={560}
                        height={560}
                        className="absolute sm:-top-30 sm:-right-60 sm:w-full w-[100px] sm:left-auto left-1/2  -top-30 sm:translate-0 -translate-x-1/2  "
                    />
                    <p className={'text-4xl font-bold text-blue-400'}>CHACCO BOMB!</p>
                    <p className={'text-blue-400'}>드래그를 하여 합이 10이 되도록 하자!</p>
                    <button
                        className={'text-xl hover:bg-blue-500 font-semibold cursor-pointer  bg-blue-400 px-2.5 py-2 rounded mt-10'}
                        onClick={handleGameStart}
                    >
                        GAME START
                    </button>
                </div>
            )}

            {gameStarted && (
                <div
                    className="relative w-[350px] h-[200px] sm:w-[960px] sm:h-[470px] bg-white grid grid-cols-20 grid-rows-10 relative"
                    ref={containerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {showImage && (
                        <Image
                            src="/pochacco.gif"
                            alt="gif"
                            width={500}
                            height={300}
                            className="absolute z-50 top-0 left-0 w-full h-full object-cover"
                        />
                    )}

                    {grid?.map((row, rowIndex) =>
                        row.map((cell, colIndex) => {
                            const key = `${rowIndex}-${colIndex}`;
                            const isHighlighted = highlightedCells.has(key);

                            return (
                                <div
                                    key={key}
                                    className="w-full h-full flex items-center justify-center border border-gray-200 relative select-none"
                                >
                                    <div className={`sm:text-3xl ${isHighlighted ? 'opacity-100' : 'opacity-50'}`}>
                                        {cell.carrot}
                                    </div>
                                    {cell.number > 0 && (
                                        <div className="absolute text-black sm:text-lg">{cell.number}</div>
                                    )}
                                </div>
                            );
                        })
                    )}

                    {isDragging && (
                        <div
                            className="absolute bg-yellow-200 opacity-50 border border-yellow-500 pointer-events-none z-50"
                            style={getSelectionStyle()}
                        />
                    )}
                    {feedbackEmoji && (
                        <div
                            className={`text-5xl absolute  left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2  ${feedbackEmoji === "+20" ? "text-green-400" : "text-red-400"}`}>{feedbackEmoji}</div>
                    )}
                </div>
            )}

            {gameOver && (
                <div
                    className="absolute top-0 left-0 w-full  text-white flex-col h-full flex justify-center items-center bg-black/50 select-none">
                    <p className="text-4xl font-bold">GAME OVER</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-xl bg-black/50 px-2.5 py-2 mt-10 hover:bg-black rounded cursor-pointer"
                    >
                        Restart
                    </button>
                </div>
            )}

            {
                gameStarted &&
                <div className={'absolute left-5 top-5 sm:left-auto sm:right-5 flex nim-w-[200px] flex-col'}>
                    <div className=" sm:text-2xl text-gray-600 font-semibold">Time : {timeLeft}s</div>
                    <div className="  sm:text-2xl text-gray-600 font-semibold">Score : {score}</div>
                    <p className={'text-red-400'}>배경음악을 끄면 집중력이 향상됩니다.</p>

                </div>
            }

            {/* 배경음악 */}
            <audio ref={audioRef} loop>
                <source src="/background-music.mp3" type="audio/mpeg" />
                Your browser does not support the audio element.
            </audio>

            {/* 볼륨 조절 슬라이더 */}
            {gameStarted && (
                <div
                    ref={sliderRef}
                    style={{
                        position: 'fixed',
                        right: pos.x,
                        bottom: pos.y,
                        transition: 'right 0.05s linear, bottom 0.05s linear',
                    }}
                    className="flex items-center bg-white rounded-xl shadow-md p-2 z-50"
                >
                    <span className="mr-2">🔈</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        className="w-24 sm:inline hidden"
                        value={volume}
                        onChange={handleVolumeChange}
                        onClick={(e) => e.preventDefault()} // 클릭 못하게!

                    />
                </div>
            )}

        </div>
    );
}
